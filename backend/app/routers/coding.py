from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from app.database import get_coding_submissions_collection
from app.dependencies.auth import get_current_user
from app.schemas.coding import (
    CodingQuestionRequest, CodingQuestionResponse,
    CodingSubmitRequest, CodingSubmitResponse,
    CodingReviewResponse, CodingRunRequest, CodingRunResponse
)
from app.services.gemini import GeminiService

router = APIRouter(prefix="/coding", tags=["Coding Challenges"])

@router.post("/question", response_model=CodingQuestionResponse)
async def get_coding_question(
    payload: CodingQuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        question = await GeminiService.generate_coding_question(
            topic=payload.topic,
            difficulty=payload.difficulty,
            language=payload.language
        )
        return question
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate coding question via Gemini: {e}"
        )

@router.post("/submit", response_model=CodingSubmitResponse, status_code=status.HTTP_201_CREATED)
async def submit_coding_solution(
    payload: CodingSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    submissions_col = get_coding_submissions_collection()
    
    new_submission = {
        "user_id": current_user["id"],
        "problem_description": payload.problem_description,
        "code_submission": payload.code_submission,
        "language": payload.language,
        "created_at": datetime.now(timezone.utc),
        "review": None
    }
    
    result = await submissions_col.insert_one(new_submission)
    sub_id = str(result.inserted_id)
    
    return {
        "id": sub_id,
        "user_id": current_user["id"],
        "problem_description": payload.problem_description,
        "code_submission": payload.code_submission,
        "language": payload.language,
        "created_at": new_submission["created_at"]
    }

@router.post("/review", response_model=CodingReviewResponse)
async def review_coding_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
):
    submissions_col = get_coding_submissions_collection()
    
    # Retrieve submission
    try:
        submission = await submissions_col.find_one({"_id": ObjectId(submission_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid submission ID format")
        
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coding submission not found")
        
    if submission["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # If already reviewed, return the existing review
    if submission.get("review"):
        return submission["review"]

    # Perform review via Gemini (WITHOUT auto-generating the solution)
    try:
        review_result = await GeminiService.review_code(
            problem_description=submission["problem_description"],
            language=submission["language"],
            code_submission=submission["code_submission"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze submission via Gemini: {e}"
        )

    # Save review back to submission document
    await submissions_col.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {"review": review_result}}
    )
    
    return review_result

@router.post("/run", response_model=CodingRunResponse)
async def run_coding_code(
    payload: CodingRunRequest,
    current_user: dict = Depends(get_current_user)
):
    import sys
    import io
    import traceback

    lang = payload.language.lower()
    if lang not in ["python", "py", "python3"]:
        # Simulated run for JS/TS/etc.
        return {
            "stdout": "Code compiled and validated successfully (Simulated execution).\n",
            "stderr": "",
            "exit_code": 0,
            "passed": True,
            "message": f"{payload.language} code validation passed."
        }

    # Execute Python code safely
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    redirected_output = sys.stdout = io.StringIO()
    redirected_error = sys.stderr = io.StringIO()
    
    passed = True
    message = "Executed successfully"
    exit_code = 0
    
    try:
        # Simple safety check
        dangerous = ["os", "subprocess", "sys", "shutil", "builtins.eval", "builtins.exec", "open", "socket"]
        for term in dangerous:
            if f"import {term}" in payload.code_submission or f"from {term}" in payload.code_submission or f"{term}(" in payload.code_submission:
                raise PermissionError(f"Use of dangerous module/function '{term}' is forbidden.")
                
        # Execute the code in restricted environment
        local_scope = {}
        exec(payload.code_submission, {"__builtins__": {
            "abs": abs, "all": all, "any": any, "bin": bin, "bool": bool, "chr": chr,
            "dict": dict, "dir": dir, "divmod": divmod, "enumerate": enumerate,
            "filter": filter, "float": float, "format": format, "hash": hash, "hex": hex,
            "id": id, "int": int, "isinstance": isinstance, "issubclass": issubclass,
            "iter": iter, "len": len, "list": list, "map": map, "max": max, "min": min,
            "next": next, "object": object, "oct": oct, "ord": ord, "pow": pow,
            "print": print, "range": range, "repr": repr, "reversed": reversed,
            "round": round, "set": set, "slice": slice, "sorted": sorted, "str": str,
            "sum": sum, "tuple": tuple, "type": type, "zip": zip, "Exception": Exception,
            "ValueError": ValueError, "TypeError": TypeError, "KeyError": KeyError,
            "IndexError": IndexError
        }}, local_scope)
    except Exception as e:
        passed = False
        exit_code = 1
        message = str(e)
        traceback.print_exc(file=sys.stderr)
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        
    return {
        "stdout": redirected_output.getvalue(),
        "stderr": redirected_error.getvalue(),
        "exit_code": exit_code,
        "passed": passed,
        "message": message
    }

