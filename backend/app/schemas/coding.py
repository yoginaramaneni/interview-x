from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class CodingQuestionRequest(BaseModel):
    topic: str
    difficulty: str = "Medium"  # Easy, Medium, Hard
    language: str = "Python"

class CodingTestCase(BaseModel):
    input: str
    expected: str

class CodingQuestionResponse(BaseModel):
    title: str
    description: str
    starter_code: str
    test_cases: List[CodingTestCase]

class CodingSubmitRequest(BaseModel):
    problem_description: str
    code_submission: str
    language: str = "Python"

class CodingSubmitResponse(BaseModel):
    id: str
    user_id: str
    problem_description: str
    code_submission: str
    language: str
    created_at: datetime

class CodingReviewRequest(BaseModel):
    submission_id: str

class CodingReviewResponse(BaseModel):
    time_complexity: str
    space_complexity: str
    optimization_suggestions: str
    strengths: str
    weaknesses: str
    score: int

class CodingRunRequest(BaseModel):
    code_submission: str
    language: str = "Python"
    problem_description: Optional[str] = None

class CodingRunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    passed: bool
    message: str

