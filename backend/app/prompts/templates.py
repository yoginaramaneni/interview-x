# Prompt Templates for InterviewAI X AI Services

RESUME_PARSE_PROMPT = """
You are an expert ATS (Applicant Tracking System) parser. Analyze the raw text extracted from a resume and extract the key fields.
Make sure you accurately identify the candidate's name, email, phone number, skills, educational background, professional experience, projects, and certifications.

Raw Resume Text:
---
{resume_text}
---

Your response must be in JSON format matching the schema requested.
"""

JOB_ANALYZE_PROMPT = """
You are an expert Technical Recruiter. Parse the following job description text and extract key metadata, including company name, role name, required technical skills, preferred skills, core responsibilities, and years of experience requested.

Raw Job Description:
---
{job_text}
---

Your response must be in JSON format matching the schema requested.
"""

ATS_SCORE_PROMPT = """
Compare the candidate's resume with the job description.
Perform a strict ATS (Applicant Tracking System) analysis. Generate an overall ATS Score (0-100), detailed skill matching percentage, list of missing critical skills, a concise summary of the resume, core strengths, primary weaknesses, and clear improvement suggestions.

Candidate Resume Data:
{resume_data}

Job Description Data:
{job_data}

Your response must be in JSON format matching the schema requested.
"""

INTERVIEW_QUESTION_PROMPT = """
You are an expert interviewer for the position of {role_name} at {company_name}.
Generate a single interview question.

Guidelines:
- Review the Job Description details: {job_details}
- Review the Candidate's Resume/Profile: {candidate_profile}
- Review the Interview History (questions asked and candidate answers):
{history}

Current State:
- We are at turn {turn_count} of the interview.
- The previous question's difficulty level was {current_difficulty} (1 to 5).
- If the candidate's last answer was strong, you may increase the difficulty or ask a deep follow-up.
- If the candidate struggled, you should lower the difficulty or pivot to clarify.
- If this is the first turn, ask a good introductory technical question tailored to the resume and job requirements.

Generate a JSON response containing:
1. "question": The question text.
2. "topic": The topic being evaluated.
3. "difficulty": The difficulty level (1-5) for this question.
4. "is_follow_up": Boolean indicating if this is a direct follow-up to the previous answer.
"""

INTERVIEW_ANSWER_EVAL_PROMPT = """
Evaluate the candidate's answer to the interview question below.

Question: {question_text}
Topic: {question_topic}
Difficulty: {question_difficulty}
Candidate's Answer: {candidate_answer}

Provide an objective assessment of the answer. Generate:
1. "score": A rating from 0 to 100 for this answer.
2. "feedback": Short constructive feedback on the answer.
3. "key_points_covered": List of important technical points the candidate mentioned.
4. "key_points_missed": List of important technical points the candidate missed.
"""

CODING_QUESTION_PROMPT = """
Generate a coding interview question.
Target Topic: {topic}
Difficulty: {difficulty} (Easy, Medium, Hard)

The response should contain:
1. "title": The title of the question.
2. "description": A clear problem statement with input/output format, constraints, and examples.
3. "starter_code": Starter code skeleton in {language}.
4. "test_cases": A list of simple test cases (input and expected output) to help the candidate verify.
"""

CODING_REVIEW_PROMPT = """
Review the candidate's code submission for the following problem.

Problem:
{problem_description}

Candidate's Code Submission (Language: {language}):
```
{code_submission}
```

IMPORTANT: Do NOT generate the full code solution. Focus purely on review and analysis.

Provide:
1. "time_complexity": Predicted time complexity (e.g. O(N log N)) with brief justification.
2. "space_complexity": Predicted space complexity (e.g. O(N)) with brief justification.
3. "strengths": What was done well in the code.
4. "weaknesses": Bugs, edge-case failures, or structural issues.
5. "optimization_suggestions": Clear suggestions on how to improve efficiency, readability, or reliability.
6. "score": Overall score (0-100) for this submission.
"""

APTITUDE_QUESTION_PROMPT = """
Generate {num_questions} multiple-choice aptitude and logical reasoning questions.
Topic: {topic}
Difficulty: {difficulty} (Easy, Medium, Hard)

Each question in the list must have:
1. "question_text": The problem statement.
2. "options": A list of exactly 4 choices (A, B, C, D) with their text.
3. "correct_option": The key of the correct option (e.g. "A", "B", "C", "D").
4. "explanation": A detailed, step-by-step walkthrough of how to solve the problem to get the correct answer.
"""

REPORT_COMPILATION_PROMPT = """
You are a Lead Hiring Manager. Compile a comprehensive candidate performance report and hiring recommendation based on the following evaluation modules.

Candidate Profile:
{profile_data}

Interview Module Performance:
{interview_data}

Coding Module Performance:
{coding_data}

Aptitude Module Performance:
{aptitude_data}

Based on these details, calculate:
1. "overall_score": Weighted average (0-100).
2. "technical_score": Assessment of core technical knowledge (0-100).
3. "communication_score": Assessment of articulation, tone, and clarity (0-100).
4. "coding_score": Score of the coding challenges (0-100).
5. "aptitude_score": Score of the logical/aptitude tests (0-100).
6. "strengths": A summary list of key candidate strengths.
7. "weaknesses": A summary list of key candidate weaknesses.
8. "learning_plan": A structured roadmap for the candidate to address their gaps.
9. "hiring_recommendation": One of: "Strong Hire", "Hire", "No Hire", "Strong No Hire" with a detailed rationale explaining why.
"""
