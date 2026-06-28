# Deployment Guide: LLM-Powered Code Review Bot

This guide provides step-by-step instructions to deploy the LLM-Powered Code Review Bot locally and using containerized environments.

---

## 1. Local Deployment (Standard Setup)

### Prerequisites
-   Python 3.10+ (Python 3.13 is fully supported)
-   An OpenAI API Key (or use the mock review fallback if offline)

### Step 1: Clone & Navigate
Navigate to the project root directory:
```bash
cd code-review-bot
```

### Step 2: Set Up Virtual Environment
Create and activate a Python virtual environment:
```bash
python -m venv venv

# On Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# On macOS/Linux
source venv/bin/activate
```

### Step 3: Install Dependencies
Install the required packages listed in `requirements.txt`:
```bash
pip install -r backend/requirements.txt
```

### Step 4: Configure Environment Variables
Edit the [backend/.env](file:///C:/Users/duada/.gemini/antigravity/scratch/code-review-bot/backend/.env) file and enter your OpenAI API credentials:
```env
OPENAI_API_KEY=sk-proj-YourActualOpenAIKeyHere
```

### Step 5: Start the Server
Run the Flask server:
```bash
python backend/app.py
```
*The app will automatically initialize the SQLite database (`code_review.db`), index RAG documents, and host the web interface at **`http://localhost:5000`**.*

---

## 2. Containerized Deployment (Docker Setup)

If you have Docker installed, you can launch the complete system in a single command.

### Launch with Docker Compose
Run the following command in the project root:
```bash
docker-compose up --build
```
This builds the slim Python container, runs database migrations, initializes the RAG vector documents, and mounts persistent volumes. Access the app at `http://localhost:5000`.

---

## 3. Production Cloud Deployment (Render / Railway)

### Deploying the Backend on Render
1.  Push your code repository to GitHub.
2.  Create a new **Web Service** on Render.
3.  Connect your repository.
4.  Configure Settings:
    -   **Environment**: `Python`
    -   **Build Command**: `pip install -r backend/requirements.txt`
    -   **Start Command**: `gunicorn --chdir backend app:app`
5.  Add your Env Variables:
    -   `SECRET_KEY`: (A random secure string)
    -   `OPENAI_API_KEY`: (Your OpenAI secret key)
    -   `DATABASE_PATH`: `code_review.db`
6.  Deploy. Render provides a public HTTPS domain. Use this domain to configure your GitHub webhook!
