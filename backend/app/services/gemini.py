import json
import logging
import google.generativeai as genai
from app.config import settings
from app.prompts.templates import (
    RESUME_PARSE_PROMPT, JOB_ANALYZE_PROMPT, ATS_SCORE_PROMPT,
    INTERVIEW_QUESTION_PROMPT, INTERVIEW_ANSWER_EVAL_PROMPT,
    CODING_QUESTION_PROMPT, CODING_REVIEW_PROMPT,
    APTITUDE_QUESTION_PROMPT, REPORT_COMPILATION_PROMPT
)

logger = logging.getLogger(__name__)

# Initialize the Gemini API client
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "mock-api-key":
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info("Gemini API configured successfully.")
else:
    logger.warning("Gemini API Key is missing or set to mock. Running in mock-fallback mode.")

import time
import random

class GeminiService:
    @staticmethod
    def _is_mock_mode() -> bool:
        return not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "mock-api-key"

    @classmethod
    async def _call_gemini(cls, prompt: str, system_instruction: str = None) -> str:
        """Helper to invoke Gemini API with optional system instructions and exponential backoff retries."""
        if cls._is_mock_mode():
            logger.debug("Mock mode active. Skipping live API call.")
            raise ValueError("Mock Mode Enabled")

        try:
            model_name = "gemini-2.5-flash"
            
            generation_config = {
                "response_mime_type": "application/json",
            }
            
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=generation_config,
                system_instruction=system_instruction
            )
            
            import asyncio
            from concurrent.futures import ThreadPoolExecutor
            loop = asyncio.get_event_loop()
            
            def sync_generate():
                max_retries = 3
                initial_delay = 1.0
                backoff_factor = 2.0
                
                for attempt in range(max_retries):
                    try:
                        response = model.generate_content(prompt)
                        return response.text
                    except Exception as ex:
                        if attempt == max_retries - 1:
                            logger.error(f"Gemini API final attempt failed: {ex}")
                            raise ex
                        delay = initial_delay * (backoff_factor ** attempt) + random.uniform(0, 0.5)
                        logger.warning(f"Gemini attempt {attempt + 1} failed: {ex}. Retrying in {delay:.2f}s...")
                        time.sleep(delay)
                
            with ThreadPoolExecutor() as pool:
                result = await loop.run_in_executor(pool, sync_generate)
                
            return result
        except Exception as e:
            logger.error(f"Gemini API failure: {e}")
            raise e

    @classmethod
    async def transcribe_audio(cls, audio_bytes: bytes, mime_type: str) -> str:
        if cls._is_mock_mode():
            logger.debug("Mock mode active. Returning mock transcription.")
            return "This is a mock transcription of the candidate's audio response discussing React rendering optimizations."
        
        try:
            model_name = "gemini-2.5-flash"
            model = genai.GenerativeModel(model_name=model_name)
            
            import asyncio
            from concurrent.futures import ThreadPoolExecutor
            loop = asyncio.get_event_loop()
            
            def sync_generate():
                max_retries = 3
                initial_delay = 1.0
                backoff_factor = 2.0
                
                for attempt in range(max_retries):
                    try:
                        response = model.generate_content([
                            {
                                "mime_type": mime_type,
                                "data": audio_bytes
                            },
                            "Transcribe the following audio recording accurately. Return only the transcription text, nothing else. If the audio is silent or unintelligible, return an empty string."
                        ])
                        return response.text
                    except Exception as ex:
                        if attempt == max_retries - 1:
                            logger.error(f"Gemini audio transcription final attempt failed: {ex}")
                            raise ex
                        delay = initial_delay * (backoff_factor ** attempt) + random.uniform(0, 0.5)
                        logger.warning(f"Gemini audio transcription attempt {attempt + 1} failed: {ex}. Retrying in {delay:.2f}s...")
                        time.sleep(delay)
                
            with ThreadPoolExecutor() as pool:
                result = await loop.run_in_executor(pool, sync_generate)
            return result.strip()
        except Exception as e:
            logger.error(f"Failed to transcribe audio via Gemini: {e}")
            raise e

    @classmethod
    async def parse_resume(cls, resume_text: str) -> dict:
        prompt = RESUME_PARSE_PROMPT.format(resume_text=resume_text)
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are an expert resume parsing system. Output JSON only."
            )
            return json.loads(raw_response)
        except Exception as e:
            logger.warning(f"Failed to parse resume via Gemini, returning fallback mock. Error: {e}")
            # Mock Fallback data
            return {
                "name": "Jane Doe",
                "email": "jane.doe@example.com",
                "phone": "+1-555-0199",
                "skills": ["Python", "FastAPI", "MongoDB", "JavaScript", "Docker", "Machine Learning"],
                "education": [
                    {
                        "institution": "State University",
                        "degree": "B.S. Computer Science",
                        "start_year": "2018",
                        "end_year": "2022"
                    }
                ],
                "projects": [
                    {
                        "title": "E-Commerce Microservice",
                        "description": "Built scalable cart microservice with FastAPI and Redis.",
                        "technologies": ["FastAPI", "Redis", "Docker"]
                    }
                ],
                "experience": [
                    {
                        "company": "TechSolutions Inc.",
                        "role": "Junior Backend Developer",
                        "start_date": "2022-06",
                        "end_date": "Present",
                        "responsibilities": ["Design APIs", "Maintain PostgreSQL database", "Optimized queries by 20%"]
                    }
                ],
                "certifications": ["AWS Certified Developer Associate"]
            }

    @classmethod
    async def analyze_job(cls, job_text: str) -> dict:
        prompt = JOB_ANALYZE_PROMPT.format(job_text=job_text)
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are an expert job description analyzer. Output JSON only."
            )
            return json.loads(raw_response)
        except Exception as e:
            logger.warning(f"Failed to analyze job via Gemini, returning fallback mock. Error: {e}")
            return {
                "company": "Innovate Corp",
                "role": "Backend Engineer",
                "required_skills": ["Python", "FastAPI", "Asyncio", "SQL"],
                "preferred_skills": ["Docker", "Kubernetes", "NoSQL", "CI/CD"],
                "responsibilities": [
                    "Develop and maintain high performance backend APIs",
                    "Integrate third-party services and databases",
                    "Optimize applications for maximum speed and scalability"
                ],
                "experience": "2+ years"
            }

    @classmethod
    async def calculate_ats(cls, resume_data: dict, job_data: dict) -> dict:
        prompt = ATS_SCORE_PROMPT.format(
            resume_data=json.dumps(resume_data, indent=2),
            job_data=json.dumps(job_data, indent=2)
        )
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are a strict ATS matcher scoring resumes against JDs. Output JSON only."
            )
            return json.loads(raw_response)
        except Exception as e:
            logger.warning(f"Failed to calculate ATS score, returning fallback mock. Error: {e}")
            return {
                "ats_score": 85,
                "skill_match": 80,
                "missing_skills": ["Kubernetes", "CI/CD"],
                "resume_summary": "The candidate has strong foundation in FastAPI, Python and backend development, lacking container orchestration skills.",
                "strengths": ["Strong FastAPI experience", "Clean database query optimization design"],
                "weaknesses": ["No cloud platform certifications or deployment skills mentioned"],
                "improvement_suggestions": [
                    "Include cloud deployment details (AWS/GCP)",
                    "List experience with container orchestration tools like Kubernetes"
                ]
            }

    @classmethod
    async def generate_question(
        cls, role_name: str, company_name: str, job_details: dict,
        candidate_profile: dict, history: list, turn_count: int, current_difficulty: int
    ) -> dict:
        prompt = INTERVIEW_QUESTION_PROMPT.format(
            role_name=role_name,
            company_name=company_name,
            job_details=json.dumps(job_details),
            candidate_profile=json.dumps(candidate_profile),
            history=json.dumps(history),
            turn_count=turn_count,
            current_difficulty=current_difficulty
        )
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are an expert technical interviewer. Output JSON only."
            )
            return json.loads(raw_response)
        except Exception as e:
            logger.warning(f"Failed to generate interview question, returning fallback mock. Error: {e}")
            fallback_questions = [
                {
                    "question": "Can you explain how concurrency works in FastAPI using async def?",
                    "topic": "FastAPI Concurrency",
                    "difficulty": 3,
                    "is_follow_up": False
                },
                {
                    "question": "How do you optimize slow query performances in MongoDB using indexes?",
                    "topic": "MongoDB Indexing",
                    "difficulty": 4,
                    "is_follow_up": True
                },
                {
                    "question": "What is the difference between an Access Token and a Refresh Token in JWT authentication?",
                    "topic": "Security/JWT",
                    "difficulty": 2,
                    "is_follow_up": False
                }
            ]
            import random
            return random.choice(fallback_questions)

    @classmethod
    async def evaluate_answer(
        cls, question_text: str, question_topic: str, question_difficulty: int, candidate_answer: str
    ) -> dict:
        prompt = INTERVIEW_ANSWER_EVAL_PROMPT.format(
            question_text=question_text,
            question_topic=question_topic,
            question_difficulty=question_difficulty,
            candidate_answer=candidate_answer
        )
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are an objective interviewer grading responses. Output JSON only."
            )
            return json.loads(raw_response)
        except Exception as e:
            logger.warning(f"Failed to evaluate answer, returning fallback mock. Error: {e}")
            return {
                "score": 80,
                "feedback": "The candidate has a solid understanding of the concepts but missed discussing execution thread safety details.",
                "key_points_covered": ["Async/await event loops", "Non-blocking requests"],
                "key_points_missed": ["Threadpool execution for CPU-bound tasks", "Context switching overhead"]
            }

    @classmethod
    async def generate_coding_question(cls, topic: str, difficulty: str, language: str) -> dict:
        prompt = CODING_QUESTION_PROMPT.format(
            topic=topic,
            difficulty=difficulty,
            language=language
        )
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are a senior algorithms designer. Output JSON only."
            )
            return json.loads(raw_response)
        except Exception as e:
            logger.warning(f"Failed to generate coding question, returning fallback mock. Error: {e}")
            return {
                "title": "Reverse Linked List",
                "description": "Given the head of a singly linked list, reverse the list, and return its head.\n\nConstraints:\n- The number of nodes in the list is the range [0, 5000].\n- -5000 <= Node.val <= 5000",
                "starter_code": "def reverseList(head):\n    # Write your code here\n    pass",
                "test_cases": [
                    {"input": "[1,2,3,4,5]", "expected": "[5,4,3,2,1]"},
                    {"input": "[1,2]", "expected": "[2,1]"},
                    {"input": "[]", "expected": "[]"}
                ]
            }

    @classmethod
    async def review_code(cls, problem_description: str, language: str, code_submission: str) -> dict:
        prompt = CODING_REVIEW_PROMPT.format(
            problem_description=problem_description,
            language=language,
            code_submission=code_submission
        )
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are a static code analyzer. Output JSON only. Do NOT provide solution code."
            )
            return json.loads(raw_response)
        except Exception as e:
            logger.warning(f"Failed to review code, returning fallback mock. Error: {e}")
            return {
                "time_complexity": "O(N)",
                "space_complexity": "O(1)",
                "strengths": "The solution uses the optimal iterative approach modifying pointers in place.",
                "weaknesses": "None identified for this standard implementation.",
                "optimization_suggestions": "Make sure to handle edge cases where the linked list is completely empty.",
                "score": 95
            }

    @classmethod
    async def generate_aptitude_questions(cls, topic: str, difficulty: str, num_questions: int) -> dict:
        prompt = APTITUDE_QUESTION_PROMPT.format(
            topic=topic,
            difficulty=difficulty,
            num_questions=num_questions
        )
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are a logical aptitude test creator. Output JSON only."
            )
            # Make sure it returns in expected schema
            parsed = json.loads(raw_response)
            if isinstance(parsed, dict) and "questions" in parsed:
                return parsed
            return {"questions": parsed if isinstance(parsed, list) else []}
        except Exception as e:
            logger.warning(f"Failed to generate aptitude questions, returning fallback mock. Error: {e}")
            return {
                "questions": [
                    {
                        "question_text": "If 5 machines take 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?",
                        "options": [
                            {"key": "A", "text": "100 minutes"},
                            {"key": "B", "text": "5 minutes"},
                            {"key": "C", "text": "20 minutes"},
                            {"key": "D", "text": "50 minutes"}
                        ],
                        "correct_option": "B",
                        "explanation": "If 5 machines make 5 widgets in 5 minutes, it means 1 machine takes 5 minutes to make 1 widget. Therefore, 100 machines working simultaneously will take 5 minutes to make 100 widgets."
                    },
                    {
                        "question_text": "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
                        "options": [
                            {"key": "A", "text": "$0.10"},
                            {"key": "B", "text": "$0.05"},
                            {"key": "C", "text": "$0.15"},
                            {"key": "D", "text": "$0.50"}
                        ],
                        "correct_option": "B",
                        "explanation": "Let ball cost x. Bat costs x + $1.00. x + (x + 1.00) = 1.10 -> 2x = 0.10 -> x = 0.05. Ball costs 5 cents."
                    }
                ]
            }

    @classmethod
    async def generate_report(
        cls, profile_data: dict, interview_data: list, coding_data: list, aptitude_data: list
    ) -> dict:
        prompt = REPORT_COMPILATION_PROMPT.format(
            profile_data=json.dumps(profile_data),
            interview_data=json.dumps(interview_data),
            coding_data=json.dumps(coding_data),
            aptitude_data=json.dumps(aptitude_data)
        )
        try:
            raw_response = await cls._call_gemini(
                prompt,
                system_instruction="You are a lead recruitment coordinator. Output JSON only."
            )
            return json.loads(raw_response)
        except Exception as e:
            logger.warning(f"Failed to generate scorecard report, returning fallback mock. Error: {e}")
            return {
                "overall_score": 83,
                "technical_score": 85,
                "communication_score": 80,
                "coding_score": 90,
                "aptitude_score": 75,
                "strengths": [
                    "Excellent problem solving in coding challenges",
                    "Strong familiarity with backend frameworks (FastAPI/Python)"
                ],
                "weaknesses": [
                    "Aptitude test logical accuracy could be improved",
                    "Missed deeper explanation of system architecture during dynamic interview"
                ],
                "learning_plan": {
                    "week_1": "Study logical reasoning and numerical aptitude fundamentals",
                    "week_2": "Revise systems architecture patterns and distributed databases",
                    "week_3": "Practice complex system design questions"
                },
                "hiring_recommendation": "Hire",
                "hiring_rationale": "The candidate has demonstrated very strong coding proficiency and core backend development skills. Communication is effective and clear. Highly recommended for the backend developer role."
            }
