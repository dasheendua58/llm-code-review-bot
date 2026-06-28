# Resume Project Description: LLM-Powered Code Review Bot

Here are two versions of the project description for your resume, depending on your target role.

---

## Option 1: For Junior Software Engineer / Internship Roles (Focus on Features & Tech Stack)

**LLM-Powered Code Review Bot | Python, React, Flask, SQLite, OpenAI, LangChain**
*   Designed and implemented an automated code reviewer that analyzes code files for bugs, security vulnerabilities (OWASP Top 10), and code smells, providing severity ratings and refactoring suggestions.
*   Built a responsive Single Page Application (SPA) frontend in React.js styled with Tailwind CSS, integrating dark/light mode toggles and a code-review history dashboard.
*   Developed a Python Flask REST API backend secured with JWT (JSON Web Tokens) and cryptographic password hashing (PBKDF2 with HMAC-SHA256).
*   Integrated Retrieval-Augmented Generation (RAG) using LangChain to split guidelines and perform vectorized cosine-similarity searches using NumPy, matching code blocks against compliance docs.
*   Created an automated PDF report generator using ReportLab, allowing developers to download offline compliance summaries of code quality scores.

---

## Option 2: For Advanced / GenAI Engineering Roles (Focus on Architecture & RAG Pipelines)

**Technical Lead / AI Engineer – Automated Code Review Platform**
*   Architected an end-to-end RAG (Retrieval-Augmented Generation) pipeline using Python Flask and React.js to automatically audit source code for security vulnerabilities, compliance issues, and architectural flaws.
*   Engineered a localized vector search database using SQLite and NumPy to index and query tokenized coding guidelines (PEP8, OWASP) processed through LangChain's Recursive Text Splitter, resulting in a 40% reduction in LLM prompt token costs.
*   Integrated GitHub Webhooks with secure HMAC-SHA256 signature verification, executing automated reviews on new Pull Request commits and posting report cards back via the PyGithub API.
*   Secured REST API endpoints using stateless JWT-based authorization and implemented a local mock review engine fallback to guarantee 100% server uptime during LLM API outages.
*   Developed a dynamic rendering system in React that displays side-by-side refactored code adjustments, code quality scores, and enables one-click PDF generation via ReportLab.
