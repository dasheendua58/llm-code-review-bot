# Testing Strategy: LLM-Powered Code Review Bot

To ensure the reliability, security, and performance of the LLM-Powered Code Review Bot, the project implements a three-tier testing strategy.

---

## 1. Automated Unit & Integration Tests

We implement localized test cases utilizing Python's built-in `unittest` module. The test suite is located in:
[tests.py](file:///C:/Users/duada/.gemini/antigravity/scratch/code-review-bot/backend/tests.py)

### What is Tested
1.  **Cryptography & Security**: Verifies that passwords are successfully hashed via PBKDF2 with unique salts, and that the validation functions accurately accept valid credentials while blocking brute-force attempts.
2.  **Stateless Session Tokens**: Validates the JWT generation, expiration claims, and decoding functions.
3.  **Database Integrations**: Assures SQLite tables are correctly initialized and referential integrity (foreign keys) functions properly on cascades.
4.  **RAG Semantic Search Math**: Verifies the cosine similarity algorithms using NumPy against vector arrays stored in the database.
5.  **Response Sanitization**: Ensures that GPT JSON response wrappers (markdown fences like ` ```json `) are cleanly stripped before being parsed.

### Running the Tests
Navigate to the `backend` directory and run:
```bash
python tests.py
```

---

## 2. API Manual Verification (Postman / cURL)

You can verify the HTTP API endpoints manually using command-line `cURL` operations:

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "viva_student", "email": "student@college.edu", "password": "secure_password"}'
```

### Log In
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "viva_student", "password": "secure_password"}'
```
*Response will return a JWT token string. Save this token for subsequent calls.*

### Review Pasted Code
```bash
curl -X POST http://localhost:5000/api/reviews/paste \
  -H "Authorization: Bearer <your_jwt_token_here>" \
  -H "Content-Type: application/json" \
  -d '{"code": "def run(x):\n    eval(x)", "language": "Python", "filename": "eval_injection.py"}'
```

---

## 3. UI/UX Visual Verification
-   **Dark/Light Mode**: Toggle the theme button in the settings view to verify the class transitions from `.dark` to default, updating structural styling tokens seamlessly.
-   **Dashboard Loading States**: Clear the browser local storage, log in, and verify the spinning loaders behave gracefully while backend stats are loading.
-   **Score Color Coding**: Submit a clean code file and confirm the gauge renders green. Submit a file containing unsafe code patterns (e.g., `os.system`) and verify it renders red.
