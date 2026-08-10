from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import List, Dict, Any

from app.database import (
    get_reports_collection, get_sessions_collection, get_profiles_collection,
    get_questions_collection, get_answers_collection, get_coding_submissions_collection,
    get_aptitude_results_collection
)
from app.dependencies.auth import get_current_user
from app.schemas.report import ReportResponse
from app.services.gemini import GeminiService

router = APIRouter(prefix="/report", tags=["Reports"])

@router.get("/{id}", response_model=ReportResponse)
async def get_report(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    reports_col = get_reports_collection()
    sessions_col = get_sessions_collection()
    
    # 1. Search if the report already exists (by report ID or session ID)
    query = {}
    if ObjectId.is_valid(id):
        query = {"$or": [{"_id": ObjectId(id)}, {"session_id": id}]}
    else:
        query = {"session_id": id}
        
    existing_report = await reports_col.find_one(query)
    if existing_report:
        existing_report["id"] = str(existing_report["_id"])
        return existing_report

    # 2. If not found, check if ID is an Interview Session
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID. Must be a valid report ID or interview session ID."
        )
        
    session = await sessions_col.find_one({"_id": ObjectId(id)})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No report or interview session found with this ID."
        )
        
    if session["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not own this interview session."
        )

    # 3. Gather all components for report compilation
    # A. Candidate profile
    profiles_col = get_profiles_collection()
    profile = await profiles_col.find_one({"user_id": session["user_id"]})
    profile_data = {
        "full_name": profile.get("full_name") if profile else current_user.get("full_name"),
        "skills": profile.get("skills", []) if profile else [],
        "experience": profile.get("experience", []) if profile else [],
        "education": profile.get("education", []) if profile else [],
        "certifications": profile.get("certifications", []) if profile else []
    }
    
    # B. Interview answers
    questions_col = get_questions_collection()
    answers_col = get_answers_collection()
    
    interview_history = []
    async for q in questions_col.find({"session_id": id}).sort("turn_number", 1):
        ans = await answers_col.find_one({"question_id": str(q["_id"])})
        if ans:
            interview_history.append({
                "question": q["question_text"],
                "topic": q["topic"],
                "difficulty": q["difficulty"],
                "answer": ans["answer_text"],
                "score": ans["score"],
                "feedback": ans["feedback"]
            })
            
    # C. Coding Submissions
    coding_col = get_coding_submissions_collection()
    coding_submissions = []
    async for cs in coding_col.find({"user_id": session["user_id"]}).sort("created_at", -1).limit(5):
        if cs.get("review"):
            coding_submissions.append({
                "problem": cs["problem_description"][:200] + "...",
                "score": cs["review"]["score"],
                "time_complexity": cs["review"]["time_complexity"],
                "space_complexity": cs["review"]["space_complexity"]
            })
            
    # D. Aptitude results
    aptitude_col = get_aptitude_results_collection()
    aptitude_results = []
    async for ar in aptitude_col.find({"user_id": session["user_id"]}).sort("created_at", -1).limit(5):
        aptitude_results.append({
            "topic": ar["topic"],
            "difficulty": ar["difficulty"],
            "score": ar["score"],
            "correct": ar["correct_answers"],
            "wrong": ar["wrong_answers"]
        })

    # 4. Generate report via Gemini
    try:
        report_details = await GeminiService.generate_report(
            profile_data=profile_data,
            interview_data=interview_history,
            coding_data=coding_submissions,
            aptitude_data=aptitude_results
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate scorecard report via Gemini: {e}"
        )
        
    # 5. Save report to database
    new_report = {
        "user_id": session["user_id"],
        "session_id": id,
        "overall_score": report_details.get("overall_score", 0),
        "technical_score": report_details.get("technical_score", 0),
        "communication_score": report_details.get("communication_score", 0),
        "coding_score": report_details.get("coding_score", 0),
        "aptitude_score": report_details.get("aptitude_score", 0),
        "strengths": report_details.get("strengths", []),
        "weaknesses": report_details.get("weaknesses", []),
        "learning_plan": report_details.get("learning_plan", {}),
        "hiring_recommendation": report_details.get("hiring_recommendation", "No Hire"),
        "hiring_rationale": report_details.get("hiring_rationale", ""),
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_res = await reports_col.insert_one(new_report)
    report_id = str(insert_res.inserted_id)
    
    new_report["id"] = report_id
    return new_report
