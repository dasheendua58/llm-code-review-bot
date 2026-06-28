@echo off
echo ==========================================
echo   LLM Code Review Bot - Starting Server
echo ==========================================
echo.
echo Starting Flask backend on http://127.0.0.1:5000
echo.
cd /d "%~dp0backend"
"..\venv\Scripts\python.exe" app.py
