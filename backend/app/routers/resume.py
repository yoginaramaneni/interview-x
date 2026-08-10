import os
import shutil
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from bson import ObjectId

from app.config import settings
from app.database import get_resumes_collection, get_jobs_collection
from app.dependencies.auth import get_current_user
from app.schemas.resume import ResumeResponse, ATSScoreRequest, ATSScoreResponse
from app.utils.file_parser import validate_file, parse_uploaded_file
from app.services.gemini import GeminiService

router = APIRouter(prefix="/resume", tags=["Resumes & ATS"])

@router.get("/latest", response_model=ResumeResponse)
async def get_latest_resume(current_user: dict = Depends(get_current_user)):
    resumes_col = get_resumes_collection()
    resume = await resumes_col.find_one(
        {"user_id": current_user["id"]},
        sort=[("created_at", -1)]
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found for this user."
        )
    resume["id"] = str(resume["_id"])
    return resume

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate type and size
    validate_file(file)
    
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    
    # Save file with unique name
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_FOLDER, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {e}"
        )
        
    # Extract text and parse via Gemini
    try:
        raw_text = parse_uploaded_file(file_path)
        parsed_details = await GeminiService.parse_resume(raw_text)
    except Exception as e:
        # Clean up file on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse resume content: {e}"
        )

    # Save to MongoDB
    resumes_col = get_resumes_collection()
    new_resume = {
        "user_id": current_user["id"],
        "filename": file.filename,
        "filepath": file_path,
        "raw_text": raw_text,
        "parsed_details": parsed_details,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await resumes_col.insert_one(new_resume)
    resume_id = str(result.inserted_id)
    
    return {
        "id": resume_id,
        "user_id": current_user["id"],
        "filename": file.filename,
        "parsed_details": parsed_details,
        "created_at": new_resume["created_at"]
    }

@router.post("/ats-score", response_model=ATSScoreResponse)
async def get_ats_score(
    payload: ATSScoreRequest,
    current_user: dict = Depends(get_current_user)
):
    resumes_col = get_resumes_collection()
    jobs_col = get_jobs_collection()
    
    # Retrieve resume
    try:
        resume = await resumes_col.find_one({"_id": ObjectId(payload.resume_id)})
    except Exception:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid resume ID format")
         
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        
    # Retrieve job description
    try:
        job = await jobs_col.find_one({"_id": ObjectId(payload.job_id)})
    except Exception:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job description ID format")
         
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job Description not found")
        
    # Perform ATS matching via Gemini
    try:
        ats_results = await GeminiService.calculate_ats(
            resume_data=resume["parsed_details"],
            job_data=job["details"]
        )
        return ats_results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini ATS evaluation failed: {e}"
        )
