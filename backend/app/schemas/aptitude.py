from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class AptitudeOption(BaseModel):
    key: str  # A, B, C, D
    text: str

# Schema for candidate facing question (no answer)
class AptitudeQuestionClientResponse(BaseModel):
    question_text: str
    options: List[AptitudeOption]

# Schema for full question details stored/analyzed
class AptitudeQuestionDetail(BaseModel):
    question_text: str
    options: List[AptitudeOption]
    correct_option: str  # A, B, C, D
    explanation: str

# Schema of multiple questions generated
class AptitudeQuestionsResponse(BaseModel):
    topic: str
    difficulty: str
    questions: List[AptitudeQuestionClientResponse]

class AptitudeAnswerSubmission(BaseModel):
    question_text: str
    selected_option: str  # A, B, C, D

class AptitudeSubmitRequest(BaseModel):
    topic: str
    difficulty: str
    submissions: List[AptitudeAnswerSubmission]
    # We can also pass the full question list containing correct answers (encrypted or signed)
    # or let the API fetch it from Gemini again or DB. Let's make it fetch details or generate evaluation.
    # To avoid DB overhead for temporary tests, the submission can send the questions with answers or we store them in DB.
    # Let's save them to MongoDB on generation, and fetch on submit! That's the most production-ready.

class AptitudeGradedQuestion(BaseModel):
    question_text: str
    selected_option: str
    correct_option: str
    is_correct: bool
    explanation: str

class AptitudeSubmitResponse(BaseModel):
    id: str
    user_id: str
    topic: str
    difficulty: str
    score: float
    correct_answers: int
    wrong_answers: int
    topic_analysis: str
    graded_details: List[AptitudeGradedQuestion]
    created_at: datetime
