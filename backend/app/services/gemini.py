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
                # If they requested more, return them all. If less, slice.
                return parsed
            return {"questions": parsed if isinstance(parsed, list) else []}
        except Exception as e:
            logger.warning(f"Failed to generate aptitude questions, returning fallback mock. Error: {e}")
            fallback_questions = [
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
                },
                {
                    "question_text": "A train travelling at 60 km/hr passes a post in 9 seconds. What is the length of the train in meters?",
                    "options": [
                        {"key": "A", "text": "120 m"},
                        {"key": "B", "text": "150 m"},
                        {"key": "C", "text": "180 m"},
                        {"key": "D", "text": "200 m"}
                    ],
                    "correct_option": "B",
                    "explanation": "Speed = 60 * (5/18) = 50/3 m/sec. Distance (length of train) = Speed * Time = (50/3) * 9 = 150 meters."
                },
                {
                    "question_text": "If a person walks at 14 km/hr instead of 10 km/hr, he would have walked 20 km more. The actual distance travelled by him is:",
                    "options": [
                        {"key": "A", "text": "50 km"},
                        {"key": "B", "text": "70 km"},
                        {"key": "C", "text": "80 km"},
                        {"key": "D", "text": "40 km"}
                    ],
                    "correct_option": "A",
                    "explanation": "Let actual distance be x. Speed ratio = Distance ratio -> x/10 = (x+20)/14 -> 14x = 10x + 200 -> 4x = 200 -> x = 50 km."
                },
                {
                    "question_text": "A worker can build a wall in 30 days. Another worker can do it in 20 days. How long will it take if they work together?",
                    "options": [
                        {"key": "A", "text": "15 days"},
                        {"key": "B", "text": "12 days"},
                        {"key": "C", "text": "10 days"},
                        {"key": "D", "text": "8 days"}
                    ],
                    "correct_option": "B",
                    "explanation": "Combined rate per day = 1/30 + 1/20 = (2+3)/60 = 5/60 = 1/12. So they will finish in 12 days."
                },
                {
                    "question_text": "A sum of money at simple interest amounts to $815 in 3 years and to $854 in 4 years. Find the principal sum:",
                    "options": [
                        {"key": "A", "text": "$650"},
                        {"key": "B", "text": "$698"},
                        {"key": "C", "text": "$700"},
                        {"key": "D", "text": "$690"}
                    ],
                    "correct_option": "B",
                    "explanation": "Interest for 1 year = $854 - $815 = $39. Interest for 3 years = 39 * 3 = $117. Principal = $815 - $117 = $698."
                },
                {
                    "question_text": "Find the odd term in the sequence: 3, 5, 7, 12, 13, 17, 19",
                    "options": [
                        {"key": "A", "text": "7"},
                        {"key": "B", "text": "12"},
                        {"key": "C", "text": "13"},
                        {"key": "D", "text": "17"}
                    ],
                    "correct_option": "B",
                    "explanation": "All numbers except 12 are prime numbers. 12 is a composite number."
                },
                {
                    "question_text": "What is the next number in the sequence: 2, 6, 12, 20, 30, 42, ...?",
                    "options": [
                        {"key": "A", "text": "50"},
                        {"key": "B", "text": "54"},
                        {"key": "C", "text": "56"},
                        {"key": "D", "text": "60"}
                    ],
                    "correct_option": "C",
                    "explanation": "The differences between consecutive terms are 4, 6, 8, 10, 12. The next difference is 14. 42 + 14 = 56."
                },
                {
                    "question_text": "Three unbiased coins are tossed. What is the probability of getting at most two heads?",
                    "options": [
                        {"key": "A", "text": "3/4"},
                        {"key": "B", "text": "7/8"},
                        {"key": "C", "text": "1/2"},
                        {"key": "D", "text": "3/8"}
                    ],
                    "correct_option": "B",
                    "explanation": "Total outcomes = 8. The only outcome with more than 2 heads is HHH. Hence, 7 out of 8 outcomes have at most 2 heads. Probability is 7/8."
                },
                {
                    "question_text": "A father is twice as old as his son. 20 years ago, the age of the father was 12 times the age of the son. Present age of the father is:",
                    "options": [
                        {"key": "A", "text": "40 years"},
                        {"key": "B", "text": "44 years"},
                        {"key": "C", "text": "48 years"},
                        {"key": "D", "text": "50 years"}
                    ],
                    "correct_option": "B",
                    "explanation": "Let son's age be x. Father is 2x. 2x - 20 = 12(x - 20) -> 2x - 20 = 12x - 240 -> 10x = 220 -> x = 22. Father's age is 2 * 22 = 44 years."
                },
                {
                    "question_text": "If 'PROMPT' is coded as 'QSPNQU', then 'REFACTOR' is coded as:",
                    "options": [
                        {"key": "A", "text": "SFGBCUPS"},
                        {"key": "B", "text": "SFGBDUPS"},
                        {"key": "C", "text": "QDEZBSNQ"},
                        {"key": "D", "text": "SFGBDVPT"}
                    ],
                    "correct_option": "B",
                    "explanation": "Each letter in the word is replaced by its succeeding letter in alphabetical order: R->S, E->F, F->G, A->B, C->D, T->U, O->P, R->S."
                },
                {
                    "question_text": "If a store sells an item for $120 making a 20% profit, what was the cost price of the item?",
                    "options": [
                        {"key": "A", "text": "$96"},
                        {"key": "B", "text": "$100"},
                        {"key": "C", "text": "$105"},
                        {"key": "D", "text": "$98"}
                    ],
                    "correct_option": "B",
                    "explanation": "Cost Price = Selling Price / (1 + Profit Margin) = 120 / 1.20 = $100."
                },
                {
                    "question_text": "Six bells commence tolling together and toll at intervals of 2, 4, 6, 8, 10 and 12 seconds respectively. In 30 minutes, how many times do they toll together?",
                    "options": [
                        {"key": "A", "text": "15 times"},
                        {"key": "B", "text": "16 times"},
                        {"key": "C", "text": "30 times"},
                        {"key": "D", "text": "31 times"}
                    ],
                    "correct_option": "B",
                    "explanation": "LCM of 2, 4, 6, 8, 10, 12 is 120 seconds (2 minutes). In 30 minutes, they toll together 30/2 = 15 times, plus the 1st initial toll at start = 16 times."
                },
                {
                    "question_text": "A is the mother of B. B is the sister of C. C is the father of D. How is A related to D?",
                    "options": [
                        {"key": "A", "text": "Mother"},
                        {"key": "B", "text": "Aunt"},
                        {"key": "C", "text": "Grandmother"},
                        {"key": "D", "text": "Sister"}
                    ],
                    "correct_option": "C",
                    "explanation": "B is C's sister, so A (B's mother) is also C's mother. C is D's father. Therefore, A is the grandmother of D."
                },
                {
                    "question_text": "If Sunday is the first day of a month of 30 days, how many Sundays are there in that month?",
                    "options": [
                        {"key": "A", "text": "4"},
                        {"key": "B", "text": "5"},
                        {"key": "C", "text": "6"},
                        {"key": "D", "text": "Cannot be determined"}
                    ],
                    "correct_option": "B",
                    "explanation": "Sundays will fall on the 1st, 8th, 15th, 22nd, and 29th. That gives exactly 5 Sundays."
                },
                {
                    "question_text": "The average of 5 consecutive odd numbers is 61. Find the highest of these numbers.",
                    "options": [
                        {"key": "A", "text": "61"},
                        {"key": "B", "text": "63"},
                        {"key": "C", "text": "65"},
                        {"key": "D", "text": "67"}
                    ],
                    "correct_option": "C",
                    "explanation": "Let the numbers be x-4, x-2, x, x+2, x+4. Their sum is 5x. Average = 5x/5 = x = 61. The highest number is x+4 = 61 + 4 = 65."
                },
                {
                    "question_text": "A cube has a volume of 216 cubic cm. What is its surface area in square cm?",
                    "options": [
                        {"key": "A", "text": "180"},
                        {"key": "B", "text": "216"},
                        {"key": "C", "text": "240"},
                        {"key": "D", "text": "144"}
                    ],
                    "correct_option": "B",
                    "explanation": "Side length of cube a = cuberoot(216) = 6 cm. Surface area = 6 * a^2 = 6 * 36 = 216 square cm."
                },
                {
                    "question_text": "If 12 men can complete a project in 8 days, how many days will it take 16 men to complete it?",
                    "options": [
                        {"key": "A", "text": "6 days"},
                        {"key": "B", "text": "5 days"},
                        {"key": "C", "text": "4 days"},
                        {"key": "D", "text": "7 days"}
                    ],
                    "correct_option": "A",
                    "explanation": "Total Man-days required = 12 * 8 = 96. Days for 16 men = 96 / 16 = 6 days."
                },
                {
                    "question_text": "A bag contains 4 red balls, 6 blue balls, and 8 green balls. If a ball is drawn at random, what is the probability that it is NOT red?",
                    "options": [
                        {"key": "A", "text": "2/9"},
                        {"key": "B", "text": "7/9"},
                        {"key": "C", "text": "5/9"},
                        {"key": "D", "text": "1/3"}
                    ],
                    "correct_option": "B",
                    "explanation": "Total balls = 4 + 6 + 8 = 18. Non-red balls = 14. Probability = 14/18 = 7/9."
                },
                {
                    "question_text": "The speed of a boat in standing water is 9 km/h and the speed of the stream is 1.5 km/h. A distance of 105 km upstream is covered in:",
                    "options": [
                        {"key": "A", "text": "10 hours"},
                        {"key": "B", "text": "12 hours"},
                        {"key": "C", "text": "14 hours"},
                        {"key": "D", "text": "15 hours"}
                    ],
                    "correct_option": "C",
                    "explanation": "Upstream speed = 9 - 1.5 = 7.5 km/h. Time = Distance / Speed = 105 / 7.5 = 14 hours."
                },
                {
                    "question_text": "Two numbers are in the ratio 3:5. If 9 is subtracted from each, the new ratio is 12:23. What is the smaller number?",
                    "options": [
                        {"key": "A", "text": "27"},
                        {"key": "B", "text": "33"},
                        {"key": "C", "text": "45"},
                        {"key": "D", "text": "55"}
                    ],
                    "correct_option": "B",
                    "explanation": "Let numbers be 3x and 5x. (3x-9)/(5x-9) = 12/23 -> 23(3x-9) = 12(5x-9) -> 69x - 207 = 60x - 108 -> 9x = 99 -> x = 11. Smaller number is 3 * 11 = 33."
                },
                {
                    "question_text": "The ratio between the perimeter and the breadth of a rectangle is 8:1. If the area of the rectangle is 363 sq cm, what is the length of the rectangle?",
                    "options": [
                        {"key": "A", "text": "22 cm"},
                        {"key": "B", "text": "33 cm"},
                        {"key": "C", "text": "44 cm"},
                        {"key": "D", "text": "11 cm"}
                    ],
                    "correct_option": "B",
                    "explanation": "Perimeter = 2(L+B). 2(L+B)/B = 8/1 -> 2L+2B = 8B -> 2L = 6B -> L = 3B. Area = L * B = 3B^2 = 363 -> B^2 = 121 -> B = 11. Length L = 3 * 11 = 33 cm."
                },
                {
                    "question_text": "In a class, 60% of students pass in Math, 50% pass in English, and 30% pass in both. What percent of students failed in both?",
                    "options": [
                        {"key": "A", "text": "10%"},
                        {"key": "B", "text": "20%"},
                        {"key": "C", "text": "30%"},
                        {"key": "D", "text": "15%"}
                    ],
                    "correct_option": "B",
                    "explanation": "Percentage passed in at least one = P(M) + P(E) - P(M and E) = 60 + 50 - 30 = 80%. Failed in both = 100 - 80 = 20%."
                },
                {
                    "question_text": "A pipe can fill a cistern in 6 hours, while another empties it in 10 hours. If both are opened together, how long to fill the empty cistern?",
                    "options": [
                        {"key": "A", "text": "12 hours"},
                        {"key": "B", "text": "15 hours"},
                        {"key": "C", "text": "16 hours"},
                        {"key": "D", "text": "18 hours"}
                    ],
                    "correct_option": "B",
                    "explanation": "Net rate per hour = 1/6 - 1/10 = (5-3)/30 = 2/30 = 1/15. So it will take 15 hours to fill."
                },
                {
                    "question_text": "By selling 45 lemons for $40, a man loses 20%. How many should he sell for $24 to gain 20%?",
                    "options": [
                        {"key": "A", "text": "15"},
                        {"key": "B", "text": "18"},
                        {"key": "C", "text": "20"},
                        {"key": "D", "text": "24"}
                    ],
                    "correct_option": "B",
                    "explanation": "Cost price of 45 lemons = 40 / 0.80 = $50. CP of 1 lemon = 50/45 = 10/9. Target SP of 1 lemon to gain 20% = (10/9) * 1.2 = 4/3. lemons for $24 = 24 / (4/3) = 18 lemons."
                },
                {
                    "question_text": "If the day before yesterday was Thursday, what day will be the day after tomorrow?",
                    "options": [
                        {"key": "A", "text": "Sunday"},
                        {"key": "B", "text": "Monday"},
                        {"key": "C", "text": "Tuesday"},
                        {"key": "D", "text": "Saturday"}
                    ],
                    "correct_option": "B",
                    "explanation": "If day before yesterday was Thursday, yesterday was Friday, and today is Saturday. Tomorrow will be Sunday, and the day after tomorrow will be Monday."
                },
                {
                    "question_text": "Find the missing term in the sequence: 4, 9, 19, 39, 79, ...?",
                    "options": [
                        {"key": "A", "text": "119"},
                        {"key": "B", "text": "139"},
                        {"key": "C", "text": "159"},
                        {"key": "D", "text": "169"}
                    ],
                    "correct_option": "C",
                    "explanation": "The pattern is: next term = (current term * 2) + 1. 79 * 2 + 1 = 159."
                },
                {
                    "question_text": "A dealer marks his goods 30% above the cost price and gives a discount of 10% for cash payment. What is his gain percent?",
                    "options": [
                        {"key": "A", "text": "17%"},
                        {"key": "B", "text": "20%"},
                        {"key": "C", "text": "15%"},
                        {"key": "D", "text": "13%"}
                    ],
                    "correct_option": "A",
                    "explanation": "Let CP = 100. Marked Price = 130. Selling Price = 130 * 0.90 = 117. Profit = 17%."
                },
                {
                    "question_text": "Two cards are drawn together from a pack of 52 cards. The probability that one is a spade and one is a heart is:",
                    "options": [
                        {"key": "A", "text": "3/26"},
                        {"key": "B", "text": "13/102"},
                        {"key": "C", "text": "1/26"},
                        {"key": "D", "text": "1/52"}
                    ],
                    "correct_option": "B",
                    "explanation": "Total ways to choose 2 cards = 52C2 = 1326. Ways to choose 1 spade and 1 heart = 13 * 13 = 169. Probability = 169/1326 = 13/102."
                },
                {
                    "question_text": "If A:B = 2:3, B:C = 4:5, and C:D = 6:7, then A:B:C:D is:",
                    "options": [
                        {"key": "A", "text": "16:24:30:35"},
                        {"key": "B", "text": "16:22:30:35"},
                        {"key": "C", "text": "8:12:15:17"},
                        {"key": "D", "text": "18:24:30:35"}
                    ],
                    "correct_option": "A",
                    "explanation": "Combine ratios: A:B = 8:12, B:C = 12:15 (so A:B:C = 8:12:15). Since C:D = 6:7 = 15:17.5. Multiply all by 2 to get integer values: A:B:C:D = 16:24:30:35."
                }
            ]
            # Slice according to requested num_questions, up to length of list
            limit = min(num_questions, len(fallback_questions))
            return {"questions": fallback_questions[:limit]}

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
