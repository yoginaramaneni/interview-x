import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.database import get_collection, get_aptitude_results_collection
from app.dependencies.auth import get_current_user
from app.schemas.aptitude import (
    AptitudeQuestionsResponse, AptitudeSubmitRequest, AptitudeSubmitResponse,
    AptitudeQuestionClientResponse, AptitudeOption, AptitudeGradedQuestion
)
from app.services.gemini import GeminiService

router = APIRouter(prefix="/aptitude", tags=["Aptitude & Reasoning"])

@router.get("/questions", response_model=AptitudeQuestionsResponse)
async def get_aptitude_questions(
    topic: str,
    difficulty: str = "Medium",
    num_questions: int = 5,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Generate questions via Gemini
        gemini_res = await GeminiService.generate_aptitude_questions(
            topic=topic,
            difficulty=difficulty,
            num_questions=num_questions
        )
        questions_list = gemini_res.get("questions", [])
        
        # Save full questions (with correct options) in db
        # We assign a batch_id so that we can verify them on submission
        questions_col = get_collection("aptitude_questions")
        
        saved_questions = []
        client_questions = []
        
        for q in questions_list:
            q_id = str(uuid.uuid4())
            # Format options properly
            options_parsed = []
            for opt in q.get("options", []):
                options_parsed.append({
                    "key": opt.get("key", ""),
                    "text": opt.get("text", "")
                })
            
            full_q = {
                "question_id": q_id,
                "user_id": current_user["id"],
                "topic": topic,
                "difficulty": difficulty,
                "question_text": q.get("question_text", ""),
                "options": options_parsed,
                "correct_option": q.get("correct_option", ""),
                "explanation": q.get("explanation", ""),
                "created_at": datetime.now(timezone.utc)
            }
            saved_questions.append(full_q)
            
            client_questions.append({
                "question_text": q.get("question_text", ""),
                "options": options_parsed
            })
            
        if saved_questions:
            await questions_col.insert_many(saved_questions)
            
        return {
            "topic": topic,
            "difficulty": difficulty,
            "questions": client_questions
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate aptitude questions: {e}"
        )

@router.post("/submit", response_model=AptitudeSubmitResponse, status_code=status.HTTP_201_CREATED)
async def submit_aptitude_answers(
    payload: AptitudeSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    questions_col = get_collection("aptitude_questions")
    results_col = get_aptitude_results_collection()
    
    graded_details = []
    correct_count = 0
    wrong_count = 0
    
    # Process each submitted answer
    for sub in payload.submissions:
        # Find the question in db for this user and topic
        db_q = await questions_col.find_one({
            "user_id": current_user["id"],
            "topic": payload.topic,
            "question_text": sub.question_text
        })
        
        if not db_q:
            # If not found in DB (e.g. database cleared or mismatch), we fallback to grading it as false or ignore
            # But let's log it or continue
            continue
            
        is_correct = sub.selected_option.upper() == db_q["correct_option"].upper()
        if is_correct:
            correct_count += 1
        else:
            wrong_count += 1
            
        graded_details.append({
            "question_text": db_q["question_text"],
            "selected_option": sub.selected_option,
            "correct_option": db_q["correct_option"],
            "is_correct": is_correct,
            "explanation": db_q["explanation"]
        })
        
    total_questions = len(graded_details)
    score = (correct_count / total_questions * 100) if total_questions > 0 else 0.0
    
    # Perform a short analysis description
    topic_analysis = f"Completed {payload.difficulty} difficulty aptitude test on {payload.topic}. "
    if score >= 80:
        topic_analysis += "Excellent understanding and analytical logical skills."
    elif score >= 50:
        topic_analysis += "Satisfactory level, but some logical gaps were identified."
    else:
        topic_analysis += "Needs significant improvement. Review the explanations for wrong answers."
        
    # Store result in MongoDB
    new_result = {
        "user_id": current_user["id"],
        "topic": payload.topic,
        "difficulty": payload.difficulty,
        "score": score,
        "correct_answers": correct_count,
        "wrong_answers": wrong_count,
        "topic_analysis": topic_analysis,
        "graded_details": graded_details,
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_res = await results_col.insert_one(new_result)
    result_id = str(insert_res.inserted_id)
    
    # Clean up generated questions for this topic/user so the DB doesn't bloat
    await questions_col.delete_many({
        "user_id": current_user["id"],
        "topic": payload.topic
    })
    
    return {
        "id": result_id,
        "user_id": current_user["id"],
        "topic": payload.topic,
        "difficulty": payload.difficulty,
        "score": score,
        "correct_answers": correct_count,
        "wrong_answers": wrong_count,
        "topic_analysis": topic_analysis,
        "graded_details": graded_details,
        "created_at": new_result["created_at"]
    }
