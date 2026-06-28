import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

# Resolve the database path relative to the project root (parent of this file's directory)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DB_RELATIVE = os.getenv("DATABASE_PATH", "code_review.db")
DATABASE_PATH = _DB_RELATIVE if os.path.isabs(_DB_RELATIVE) else os.path.join(_PROJECT_ROOT, _DB_RELATIVE)

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enables column access by name
    # Enable foreign keys support in SQLite
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes the database schema if it doesn't already exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create Repositories Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        repo_name TEXT NOT NULL,
        github_repo_id INTEGER UNIQUE,
        webhook_secret TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Create Reviews Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        repo_id INTEGER,
        commit_sha TEXT,
        pr_number INTEGER,
        code_content TEXT NOT NULL,
        score INTEGER NOT NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(repo_id) REFERENCES repositories(id) ON DELETE SET NULL
    );
    """)

    # Create Issues Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_id INTEGER NOT NULL,
        file_path TEXT,
        line_number INTEGER,
        severity TEXT CHECK(severity IN ('Low', 'Medium', 'High')) NOT NULL,
        category TEXT NOT NULL, -- 'Bug', 'Security', 'Smell', 'Performance', 'Best Practice'
        explanation TEXT NOT NULL,
        suggested_fix TEXT NOT NULL,
        improved_code TEXT,
        FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );
    """)

    # Create Coding Standards / RAG Document Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS standards_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- e.g., 'Python', 'JavaScript', 'Security'
        content_chunk TEXT NOT NULL,
        metadata_json TEXT
    );
    """)

    conn.commit()
    conn.close()
    print("Database schema initialized successfully.")

if __name__ == "__main__":
    init_db()
