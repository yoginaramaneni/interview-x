from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class ReportResponse(BaseModel):
    id: str
    user_id: str
    session_id: str
    overall_score: int
    technical_score: int
    communication_score: int
    coding_score: int
    aptitude_score: int
    strengths: List[str]
    weaknesses: List[str]
    learning_plan: Any  # Can be dict, list or string
    hiring_recommendation: str
    hiring_rationale: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True
