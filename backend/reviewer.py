import os
import json
import re
from dotenv import load_dotenv
from openai import OpenAI
import rag_engine
import models

load_dotenv()

# Define default review model (GPT-4o approved by user)
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and "your_openai_api_key" not in api_key:
        return OpenAI(api_key=api_key)
    return None

def clean_json_response(raw_text: str) -> dict:
    """Cleans markdown fences from LLM JSON responses and parses the JSON."""
    cleaned = raw_text.strip()
    # Remove ```json ... ``` wrapper if present
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    return json.loads(cleaned)

def mock_review(code_content: str, file_path: str) -> dict:
    """Fallback static/mock review in case OpenAI API is not configured or fails."""
    # Run a simple regex-based inspection to make the fallback feel 'smart'
    issues = []
    score = 90
    
    if "password" in code_content.lower() or "secret" in code_content.lower() or "api_key" in code_content.lower():
        issues.append({
            "file_path": file_path,
            "line_number": 1,
            "severity": "High",
            "category": "Security",
            "explanation": "Potential hardcoded credential or secret found in code.",
            "suggested_fix": "Extract secrets into environment variables or use a secrets manager.",
            "improved_code": "import os\nAPI_KEY = os.getenv('API_KEY')"
        })
        score -= 15

    if "except:" in code_content or "except Exception:" in code_content:
        issues.append({
            "file_path": file_path,
            "line_number": 2,
            "severity": "Medium",
            "category": "Best Practice",
            "explanation": "Bare or generic exception handler caught. This hides unexpected bugs.",
            "suggested_fix": "Catch specific exceptions instead (e.g. ValueError, KeyError).",
            "improved_code": "try:\n    # code\nexcept ValueError as e:\n    logger.error(f'Invalid value: {e}')"
        })
        score -= 10

    if "os.system(" in code_content:
        issues.append({
            "file_path": file_path,
            "line_number": 3,
            "severity": "High",
            "category": "Security",
            "explanation": "Use of os.system detected. This is vulnerable to shell injections.",
            "suggested_fix": "Use subprocess.run(..., shell=False) or standard library alternatives.",
            "improved_code": "import subprocess\nsubprocess.run(['ls', '-la'], check=True)"
        })
        score -= 20

    if len(issues) == 0:
        issues.append({
            "file_path": file_path,
            "line_number": 1,
            "severity": "Low",
            "category": "Readability",
            "explanation": "No major issues found. Ensure clean docstrings and descriptive names.",
            "suggested_fix": "Add documentation to modules and functions.",
            "improved_code": "def example_function():\n    \"\"\"Docstring explaining functionality.\"\"\"\n    pass"
        })

    return {
        "score": max(0, score),
        "summary": "Mock Review (OpenAI API key missing/invalid). The review bot analyzed common coding patterns statically.",
        "issues": issues,
        "refactoring_suggestions": "Configure your OPENAI_API_KEY in the backend/.env file to unlock GPT-4o analysis."
    }

def review_code(code_content: str, language: str, file_path: str = "code_snippet.txt", user_id: int = None, repo_id: int = None, commit_sha: str = None, pr_number: int = None) -> int:
    """
    Performs code review.
    1. Fetches context from standards database (RAG).
    2. Sends context and code to GPT-4o.
    3. Saves results to SQL database and returns review ID.
    """
    # 1. Fetch relevant coding standards using RAG
    rag_query = f"{language} code quality, bug check, security, standards violations"
    standards_chunks = rag_engine.query_standards(rag_query, category=language, limit=4)
    
    standards_context = "\n\n".join([
        f"--- Coding Standard Reference ({chunk['title']}) ---\n{chunk['content_chunk']}"
        for chunk in standards_chunks
    ])

    # 2. Build system and user prompts
    system_prompt = """You are an elite Senior Software Engineer and Technical Architect.
Your task is to perform a detailed code review.
You must analyze the code for:
1. Bugs and syntax errors.
2. Security vulnerabilities (OWASP top 10).
3. Code smells (refactoring targets, clean code violations).
4. Performance bottlenecks (unnecessary loops, bad memory usage).
5. Best practices and standards violations.
6. Readability and maintainability issues.

You must output your review strictly in valid JSON format. Do not write markdown intro/outro text, just return the JSON object matching this schema:
{
  "score": 85, // Integer from 0 to 100 representing overall quality (100 is flawless)
  "summary": "High-level summary of the code review findings.",
  "issues": [
    {
      "file_path": "filename.py",
      "line_number": 14, // 1-indexed line number of the issue (null if global)
      "severity": "High", // Must be "Low", "Medium", or "High"
      "category": "Security", // Must be "Bug", "Security", "Smell", "Performance", "Best Practice", "Readability"
      "explanation": "Detailed explanation of the problem.",
      "suggested_fix": "Code snippet or step-by-step fix suggestion.",
      "improved_code": "Code block containing the corrected lines of code."
    }
  ],
  "refactoring_suggestions": "Overall suggestions for refactoring or architectural improvements."
}"""

    user_prompt = f"""Review the following source code:
File: {file_path}
Language: {language}

Source Code:
```
{code_content}
```

Here is the retrieved Coding Standards context that you should compare the code against:
{standards_context}

Perform the review and return the structured JSON object. Ensure all JSON fields are populated.
"""

    client_openai = get_openai_client()
    
    if not client_openai:
        # Fallback to mock review if OpenAI is not configured
        print("OpenAI client not configured. Generating static mock review.")
        review_data = mock_review(code_content, file_path)
    else:
        try:
            response = client_openai.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw_response = response.choices[0].message.content
            review_data = clean_json_response(raw_response)
        except Exception as e:
            print(f"Error during OpenAI API call: {e}")
            # Fallback to mock review on api error
            review_data = mock_review(code_content, file_path)

    # 3. Store the review in the database
    # Handle optional fields or potential JSON missing fields
    score = review_data.get("score", 70)
    summary = review_data.get("summary", "Code review completed.")
    refactoring = review_data.get("refactoring_suggestions", "")
    
    # Store review
    review_id = models.create_review(
        user_id=user_id or 1, # Default to user ID 1 if not specified
        repo_id=repo_id,
        commit_sha=commit_sha,
        pr_number=pr_number,
        code_content=code_content,
        score=score,
        summary=f"{summary}\n\nRefactoring Suggestions:\n{refactoring}"
    )

    # Store individual issues
    issues = review_data.get("issues", [])
    for issue in issues:
        models.create_issue(
            review_id=review_id,
            file_path=issue.get("file_path", file_path),
            line_number=issue.get("line_number"),
            severity=issue.get("severity", "Medium"),
            category=issue.get("category", "Best Practice"),
            explanation=issue.get("explanation", ""),
            suggested_fix=issue.get("suggested_fix", ""),
            improved_code=issue.get("improved_code", "")
        )

    return review_id
