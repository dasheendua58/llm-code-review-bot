import sqlite3
import json
from database import get_db_connection

# --- User Models ---

def create_user(username, email, password_hash):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# --- Repository Models ---

def add_repository(user_id, repo_name, github_repo_id=None, webhook_secret=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO repositories (user_id, repo_name, github_repo_id, webhook_secret) VALUES (?, ?, ?, ?)",
            (user_id, repo_name, github_repo_id, webhook_secret)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_repositories_by_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM repositories WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_repo_by_github_id(github_repo_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM repositories WHERE github_repo_id = ?", (github_repo_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# --- Review Models ---

def create_review(user_id, repo_id, commit_sha, pr_number, code_content, score, summary):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO reviews (user_id, repo_id, commit_sha, pr_number, code_content, score, summary) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (user_id, repo_id, commit_sha, pr_number, code_content, score, summary)
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def get_reviews_by_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT r.*, repo.repo_name 
           FROM reviews r 
           LEFT JOIN repositories repo ON r.repo_id = repo.id 
           WHERE r.user_id = ? 
           ORDER BY r.created_at DESC""", 
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_review_by_id(review_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT r.*, repo.repo_name 
           FROM reviews r 
           LEFT JOIN repositories repo ON r.repo_id = repo.id 
           WHERE r.id = ?""", 
        (review_id,)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


# --- Issue Models ---

def create_issue(review_id, file_path, line_number, severity, category, explanation, suggested_fix, improved_code):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO issues (review_id, file_path, line_number, severity, category, explanation, suggested_fix, improved_code) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (review_id, file_path, line_number, severity, category, explanation, suggested_fix, improved_code)
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def get_issues_by_review(review_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issues WHERE review_id = ?", (review_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# --- Coding Standards / RAG Document Models ---

def add_standards_document(title, category, content_chunk, metadata_dict=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    metadata_json = json.dumps(metadata_dict) if metadata_dict else None
    cursor.execute(
        "INSERT INTO standards_documents (title, category, content_chunk, metadata_json) VALUES (?, ?, ?, ?)",
        (title, category, content_chunk, metadata_json)
    )
    conn.commit()
    doc_id = cursor.lastrowid
    conn.close()
    return doc_id

def get_standards_documents_by_category(category):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM standards_documents WHERE category = ?", (category,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_standards_documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM standards_documents")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
