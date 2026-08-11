from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from bson import ObjectId
from typing import List, Dict, Any

from app.database import (
    get_sessions_collection, get_questions_collection, get_answers_collection,
    get_resumes_collection, get_jobs_collection
)
from app.dependencies.auth import get_current_user
from app.schemas.interview import (
    InterviewStartRequest, InterviewSessionResponse,
    InterviewQuestionResponse, InterviewAnswerSubmitRequest,
    InterviewAnswerResponse, InterviewEndResponse
)
from app.services.gemini import GeminiService

router = APIRouter(prefix="/interview", tags=["Interviews"])

@router.post("/start", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_interview(
    payload: InterviewStartRequest,
    current_user: dict = Depends(get_current_user)
):
    resumes_col = get_resumes_collection()
    jobs_col = get_jobs_collection()
    sessions_col = get_sessions_collection()
    
    resume_id = payload.resume_id
    job_id = payload.job_id

    # Fallback/default resume generation if not specified or invalid format
    if resume_id in ("default", "000000000000000000000000") or not ObjectId.is_valid(resume_id):
        default_resume = await resumes_col.find_one({"user_id": current_user["id"], "is_default": True})
        if not default_resume:
            default_resume = {
                "user_id": current_user["id"],
                "filename": "default_resume.pdf",
                "filepath": "",
                "raw_text": "Default Candidate Profile: General Software Engineer with Python, JavaScript, HTML, CSS, SQL skills.",
                "parsed_details": {
                    "name": current_user.get("full_name", "Candidate"),
                    "email": current_user.get("email", "candidate@example.com"),
                    "phone": "",
                    "skills": ["Python", "JavaScript", "HTML", "CSS", "SQL"],
                    "education": [],
                    "projects": [],
                    "experience": [],
                    "certifications": []
                },
                "is_default": True,
                "created_at": datetime.now(timezone.utc)
            }
            res = await resumes_col.insert_one(default_resume)
            resume_id = str(res.inserted_id)
        else:
            resume_id = str(default_resume["_id"])
    else:
        try:
            resume = await resumes_col.find_one({"_id": ObjectId(resume_id)})
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid resume ID format")
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Fallback/default job generation if not specified or invalid format
    if job_id in ("default", "000000000000000000000000") or not ObjectId.is_valid(job_id):
        default_job = await jobs_col.find_one({"user_id": current_user["id"], "is_default": True})
        if not default_job:
            default_job = {
                "user_id": current_user["id"],
                "raw_text": "Software Engineer role with focus on backend systems, databases, and APIs.",
                "details": {
                    "company": "InterviewAI X",
                    "role": "Software Engineer",
                    "required_skills": ["Python", "FastAPI", "MongoDB", "SQL"],
                    "preferred_skills": ["Docker", "CI/CD"],
                    "responsibilities": ["Design REST APIs", "Develop backend microservices"],
                    "experience": "1-3 years"
                },
                "is_default": True,
                "created_at": datetime.now(timezone.utc)
            }
            res = await jobs_col.insert_one(default_job)
            job_id = str(res.inserted_id)
        else:
            job_id = str(default_job["_id"])
    else:
        try:
            job = await jobs_col.find_one({"_id": ObjectId(job_id)})
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job description ID format")
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job description not found")

    # Create new interview session
    new_session = {
        "user_id": current_user["id"],
        "resume_id": resume_id,
        "job_id": job_id,
        "status": "ongoing",
        "current_turn": 0,
        "current_difficulty": 3,  # Medium starting difficulty
        "created_at": datetime.now(timezone.utc),
        "ended_at": None
    }
    
    result = await sessions_col.insert_one(new_session)
    session_id = str(result.inserted_id)
    
    return {
        "id": session_id,
        "user_id": current_user["id"],
        "resume_id": resume_id,
        "job_id": job_id,
        "status": new_session["status"],
        "current_turn": 0,
        "created_at": new_session["created_at"]
    }

@router.post("/question", response_model=InterviewQuestionResponse)
async def generate_question(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    sessions_col = get_sessions_collection()
    questions_col = get_questions_collection()
    answers_col = get_answers_collection()
    resumes_col = get_resumes_collection()
    jobs_col = get_jobs_collection()
    
    # Retrieve session
    try:
        session = await sessions_col.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")
        
    if session["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    if session["status"] == "ended":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview session has already ended")
        
    # Check if there is already an active question for the current turn that is unanswered
    # (Turn number is 1-indexed for questions. Question turn number corresponds to session's current_turn + 1)
    target_turn = session["current_turn"] + 1
    existing_unanswered_q = await questions_col.find_one({
        "session_id": session_id,
        "turn_number": target_turn
    })
    if existing_unanswered_q:
        # Check if it has an answer
        answer = await answers_col.find_one({"question_id": str(existing_unanswered_q["_id"])})
        if not answer:
            # Return this existing question
            return {
                "id": str(existing_unanswered_q["_id"]),
                "session_id": session_id,
                "question_text": existing_unanswered_q["question_text"],
                "topic": existing_unanswered_q["topic"],
                "difficulty": existing_unanswered_q["difficulty"],
                "turn_number": existing_unanswered_q["turn_number"]
            }

    # Fetch Job Details and Resume details to feed to Gemini
    resume = await resumes_col.find_one({"_id": ObjectId(session["resume_id"])})
    job = await jobs_col.find_one({"_id": ObjectId(session["job_id"])})
    
    # Build history of questions and answers
    history = []
    async for q in questions_col.find({"session_id": session_id}).sort("turn_number", 1):
        ans = await answers_col.find_one({"question_id": str(q["_id"])})
        history.append({
            "question": q["question_text"],
            "answer": ans["answer_text"] if ans else "No answer provided",
            "score": ans["score"] if ans else 0
        })

    # Call Gemini to generate the next question
    try:
        role_name = job["details"].get("role", "Software Engineer") if job else "Software Engineer"
        company_name = job["details"].get("company", "InterviewAI X") if job else "InterviewAI X"
        job_details = job["details"] if job else {}
        candidate_profile = resume["parsed_details"] if resume else {}
        
        gemini_q = await GeminiService.generate_question(
            role_name=role_name,
            company_name=company_name,
            job_details=job_details,
            candidate_profile=candidate_profile,
            history=history,
            turn_count=target_turn,
            current_difficulty=session["current_difficulty"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview question via Gemini: {e}"
        )
        
    # Save question to DB
    new_q = {
        "session_id": session_id,
        "question_text": gemini_q["question"],
        "topic": gemini_q["topic"],
        "difficulty": gemini_q["difficulty"],
        "is_follow_up": gemini_q["is_follow_up"],
        "turn_number": target_turn,
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_res = await questions_col.insert_one(new_q)
    q_id = str(insert_res.inserted_id)
    
    # Update current turn and difficulty in session
    await sessions_col.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "current_turn": target_turn,
                "current_difficulty": gemini_q["difficulty"]
            }
        }
    )
    
    return {
        "id": q_id,
        "session_id": session_id,
        "question_text": new_q["question_text"],
        "topic": new_q["topic"],
        "difficulty": new_q["difficulty"],
        "turn_number": new_q["turn_number"]
    }

@router.post("/answer", response_model=InterviewAnswerResponse)
async def submit_answer(
    payload: InterviewAnswerSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    sessions_col = get_sessions_collection()
    questions_col = get_questions_collection()
    answers_col = get_answers_collection()
    
    # Retrieve session
    try:
        session = await sessions_col.find_one({"_id": ObjectId(payload.session_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if session["status"] == "ended":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview session has already ended")

    # Retrieve question
    try:
        question = await questions_col.find_one({"_id": ObjectId(payload.question_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question ID format")
    if not question or question["session_id"] != payload.session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this session")

    # Check if already answered
    existing_answer = await answers_col.find_one({"question_id": payload.question_id})
    if existing_answer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question has already been answered")

    # Evaluate candidate's answer via Gemini
    try:
        eval_result = await GeminiService.evaluate_answer(
            question_text=question["question_text"],
            question_topic=question["topic"],
            question_difficulty=question["difficulty"],
            candidate_answer=payload.answer_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate answer via Gemini: {e}"
        )
        
    # Save answer to DB
    new_ans = {
        "session_id": payload.session_id,
        "question_id": payload.question_id,
        "answer_text": payload.answer_text,
        "score": eval_result["score"],
        "feedback": eval_result["feedback"],
        "key_points_covered": eval_result["key_points_covered"],
        "key_points_missed": eval_result["key_points_missed"],
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_res = await answers_col.insert_one(new_ans)
    ans_id = str(insert_res.inserted_id)
    
    return {
        "id": ans_id,
        "session_id": payload.session_id,
        "question_id": payload.question_id,
        "answer_text": payload.answer_text,
        "score": new_ans["score"],
        "feedback": new_ans["feedback"],
        "key_points_covered": new_ans["key_points_covered"],
        "key_points_missed": new_ans["key_points_missed"],
        "created_at": new_ans["created_at"]
    }

@router.post("/end", response_model=InterviewEndResponse)
async def end_interview(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    sessions_col = get_sessions_collection()
    
    # Retrieve session
    try:
        session = await sessions_col.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if session["status"] == "ended":
        return {
            "session_id": session_id,
            "status": "ended",
            "ended_at": session["ended_at"] if session["ended_at"] else datetime.now(timezone.utc),
            "message": "Interview session already ended."
        }
        
    # Mark session as ended
    ended_at = datetime.now(timezone.utc)
    await sessions_col.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "status": "ended",
                "ended_at": ended_at
            }
        }
    )
    
    return {
        "session_id": session_id,
        "status": "ended",
        "ended_at": ended_at,
        "message": "Interview session successfully ended."
    }

@router.post("/voice-answer", response_model=InterviewAnswerResponse)
async def submit_voice_answer(
    session_id: str = Form(...),
    question_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    sessions_col = get_sessions_collection()
    questions_col = get_questions_collection()
    answers_col = get_answers_collection()
    
    # Retrieve session
    try:
        session = await sessions_col.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session ID format")
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if session["status"] == "ended":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview session has already ended")

    # Retrieve question
    try:
        question = await questions_col.find_one({"_id": ObjectId(question_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question ID format")
    if not question or question["session_id"] != session_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this session")

    # Check if already answered
    existing_answer = await answers_col.find_one({"question_id": question_id})
    if existing_answer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question has already been answered")

    # Read audio bytes
    audio_bytes = await file.read()
    
    # Transcribe audio using Gemini
    try:
        transcribed_text = await GeminiService.transcribe_audio(audio_bytes, file.content_type)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Speech transcription failed: {e}"
        )
        
    if not transcribed_text.strip():
        # Handle "No speech detected"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No speech detected. Please try recording again."
        )

    # Evaluate the transcription text
    try:
        eval_result = await GeminiService.evaluate_answer(
            question_text=question["question_text"],
            question_topic=question["topic"],
            question_difficulty=question["difficulty"],
            candidate_answer=transcribed_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate audio transcript via Gemini: {e}"
        )
        
    # Save answer to DB
    new_ans = {
        "session_id": session_id,
        "question_id": question_id,
        "answer_text": transcribed_text,
        "score": eval_result["score"],
        "feedback": eval_result["feedback"],
        "key_points_covered": eval_result["key_points_covered"],
        "key_points_missed": eval_result["key_points_missed"],
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_res = await answers_col.insert_one(new_ans)
    ans_id = str(insert_res.inserted_id)
    
    return {
        "id": ans_id,
        "session_id": session_id,
        "question_id": question_id,
        "answer_text": transcribed_text,
        "score": new_ans["score"],
        "feedback": new_ans["feedback"],
        "key_points_covered": new_ans["key_points_covered"],
        "key_points_missed": new_ans["key_points_missed"],
        "created_at": new_ans["created_at"]
    }

