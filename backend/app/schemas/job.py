from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class JobAnalyzeRequest(BaseModel):
    jd_text: str

class JobDetails(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    responsibilities: List[str] = []
    experience: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    raw_text: str
    details: JobDetails
    created_at: datetime

    class Config:
        populate_by_name = True
