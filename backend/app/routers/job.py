from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_jobs_collection
from app.dependencies.auth import get_current_user
from app.schemas.job import JobAnalyzeRequest, JobResponse
from app.services.gemini import GeminiService

router = APIRouter(prefix="/job", tags=["Job Descriptions"])

@router.post("/analyze", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def analyze_job_description(
    payload: JobAnalyzeRequest,
    current_user: dict = Depends(get_current_user)
):
    if not payload.jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text cannot be empty."
        )

    # Call Gemini to structure the details
    try:
        structured_details = await GeminiService.analyze_job(payload.jd_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini job description analysis failed: {e}"
        )
        
    # Store in MongoDB
    jobs_col = get_jobs_collection()
    new_job = {
        "raw_text": payload.jd_text,
        "details": structured_details,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await jobs_col.insert_one(new_job)
    job_id = str(result.inserted_id)
    
    return {
        "id": job_id,
        "raw_text": payload.jd_text,
        "details": structured_details,
        "created_at": new_job["created_at"]
    }
