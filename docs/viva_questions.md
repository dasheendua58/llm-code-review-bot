# Viva Questions & Answers: LLM-Powered Code Review Bot

### Q1: What is the high-level architecture of this system?
**A:** The system follows a client-server architecture. 
- The **Frontend** is a React.js Single Page Application (SPA) styled with Tailwind CSS, utilizing browser-native ES Modules (ESM) to communicate with the backend.
- The **Backend** is a Python Flask server exposing REST API endpoints.
- The **Database** is SQLite, storing user registrations, integrated repository references, review metadata, individual code issues, and coding standards document chunks.
- The **AI Engine** integrates OpenAI's API (GPT-4o) using LangChain for chunking and NumPy for local vector search (RAG) to check code compliance.

---

### Q2: Explain the Retrieval-Augmented Generation (RAG) pipeline in your project.
**A:** RAG is used to ground the LLM's review findings in actual industry coding guidelines (like PEP8 and OWASP Top 10):
1. **Ingestion**: When the server boots, LangChain's `RecursiveCharacterTextSplitter` reads raw markdown guidelines from `standards_docs/` and breaks them into overlapping 500-character chunks.
2. **Embedding**: We generate a 1536-dimension vector for each chunk using OpenAI's `text-embedding-3-small` model.
3. **Storage**: The chunks and their JSON-serialized embedding vectors are stored in the `standards_documents` table in SQLite.
4. **Retrieval**: When code is analyzed, the system embeds the search query, runs a vectorized cosine similarity query using NumPy against all cached standard embeddings, and fetches the top-K relevant chunks.
5. **Generation**: The retrieved chunks are added directly to the LLM's prompt context, guiding it to compare the user's code directly against those specific rules.

---

### Q3: How is user authentication secured in this application?
**A:** We use JWT (JSON Web Tokens) for stateless authentication.
- During registration, the user's password is encrypted using PBKDF2 (Password-Based Key Derivation Function 2) with a unique, cryptographically secure 16-byte random salt and SHA-256 (100,000 iterations), producing a hash. We never store plain text passwords.
- During login, credentials are verified, and a JWT token signed with an HS256 algorithm and a server-side secret key is returned. The token is set with a 24-hour expiration (`exp` claim).
- Flask routes are protected using a custom `@token_required` decorator that extracts the token from the `Authorization: Bearer <token>` header, decodes it, verifies validity/expiration, and passes the authenticated user object.

---

### Q4: How does the GitHub Pull Request automation work?
**A:** 
1. The developer adds their repository (e.g. `owner/repo`) in our dashboard. The system generates a webhook URL (pointing to `/api/github/webhook`) and a secret key.
2. The user registers this webhook in their GitHub repository settings, selecting "Pull Request" events.
3. When a PR is created or updated, GitHub sends a POST payload to our endpoint containing details of the branch, commits, and a request signature header (`X-Hub-Signature-256`).
4. Our server validates the payload's integrity using HMAC SHA-256 with the stored webhook secret.
5. If validated, the backend downloads the changed files using the PyGithub library, conducts code reviews on each, averages the quality score, and posts a comprehensive markdown code review report card on the PR discussion thread.

---

### Q5: What database considerations were made, and how is the schema structured?
**A:** We used SQLite for portability. We configured `PRAGMA foreign_keys = ON` on connection establishment to enforce referential integrity.
The schema contains:
- `users`: Stores login details.
- `repositories`: Maps users to GitHub repositories.
- `reviews`: Stores review history, average score, and high-level summaries (one review can contain multiple code files).
- `issues`: Linked via foreign key to `reviews` on cascade delete. Holds individual issue severity, line number, categories, explanation, and suggestions.
- `standards_documents`: Caches chunked standards and embedding vectors.

---

### Q6: How does the system handle LLM API rate limits, costs, or downtime?
**A:**
- **RAG Pre-filtering**: Instead of sending all standards files (thousands of lines) to the LLM for every single review, RAG acts as an semantic pre-filter, pulling only the 3-4 most relevant chunks, saving token costs and reducing rate-limiting triggers.
- **Structured Outputs**: We enforce `response_format={"type": "json_object"}` in the OpenAI client to ensure the model responds strictly in valid JSON, reducing parsing failures.
- **Fail-safe Mock Engine**: If the API key is not configured or fails due to network downtime, the system catches the exception and falls back to a regex-based pattern checker. It reviews security keywords (like `password` or `secret`) and basic exception handlers, returning a simulated review. This ensures the app is always functional.
