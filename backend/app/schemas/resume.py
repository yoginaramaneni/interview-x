from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ResumeEducation(BaseModel):
    institution: str
    degree: str
    start_year: Optional[str] = None
    end_year: Optional[str] = None

class ResumeProject(BaseModel):
    title: str
    description: str
    technologies: List[str] = []

class ResumeExperience(BaseModel):
    company: str
    role: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    responsibilities: List[str] = []

class ResumeParsedDetails(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    education: List[ResumeEducation] = []
    projects: List[ResumeProject] = []
    experience: List[ResumeExperience] = []
    certifications: List[str] = []

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    parsed_details: ResumeParsedDetails
    created_at: datetime

    class Config:
        populate_by_name = True

class ATSScoreRequest(BaseModel):
    resume_id: str
    job_id: str

class ATSScoreResponse(BaseModel):
    ats_score: int
    skill_match: int
    missing_skills: List[str]
    resume_summary: str
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]
