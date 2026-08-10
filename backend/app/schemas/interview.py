from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class InterviewStartRequest(BaseModel):
    resume_id: str
    job_id: str

class InterviewSessionResponse(BaseModel):
    id: str
    user_id: str
    resume_id: str
    job_id: str
    status: str  # ongoing, ended
    current_turn: int
    created_at: datetime

    class Config:
        populate_by_name = True

class InterviewQuestionRequest(BaseModel):
    session_id: str

class InterviewQuestionResponse(BaseModel):
    id: str
    session_id: str
    question_text: str
    topic: str
    difficulty: int
    turn_number: int

class InterviewAnswerSubmitRequest(BaseModel):
    session_id: str
    question_id: str
    answer_text: str

class InterviewAnswerResponse(BaseModel):
    id: str
    session_id: str
    question_id: str
    answer_text: str
    score: int
    feedback: str
    key_points_covered: List[str]
    key_points_missed: List[str]
    created_at: datetime

class InterviewEndResponse(BaseModel):
    session_id: str
    status: str
    ended_at: datetime
    message: str
