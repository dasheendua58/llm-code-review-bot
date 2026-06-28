import os
import unittest
import json
import sqlite3
import numpy as np

# Adjust path to import backend modules
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import auth
import database
import models
import reviewer
import rag_engine

class CodeReviewBotTestCase(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Configure test database environment."""
        os.environ["DATABASE_PATH"] = "test_code_review.db"
        # Reset database tables
        if os.path.exists("test_code_review.db"):
            os.remove("test_code_review.db")
        database.init_db()

    @classmethod
    def tearDownClass(cls):
        """Cleanup test database file."""
        if os.path.exists("test_code_review.db"):
            os.remove("test_code_review.db")

    def test_01_password_hashing(self):
        """Verify PBKDF2 password hashing and verification algorithms."""
        password = "SecurePassword123"
        hashed = auth.hash_password(password)
        
        self.assertIn("$", hashed)
        self.assertTrue(auth.verify_password(hashed, password))
        self.assertFalse(auth.verify_password(hashed, "wrongpassword"))

    def test_02_user_registration_and_login(self):
        """Verify database model inserts and auth token creation."""
        username = "testuser"
        email = "test@example.com"
        pw_hash = auth.hash_password("password123")
        
        # Test creation
        user_id = models.create_user(username, email, pw_hash)
        self.assertIsNotNone(user_id)
        
        # Test duplicate registration
        duplicate_id = models.create_user(username, "other@example.com", pw_hash)
        self.assertIsNone(duplicate_id)
        
        # Test retrieval
        user = models.get_user_by_username(username)
        self.assertEqual(user["email"], email)
        
        # Test token generation and decoding
        token = auth.generate_token(user_id, username)
        payload = auth.decode_token(token)
        self.assertEqual(payload["user_id"], user_id)
        self.assertEqual(payload["username"], username)

    def test_03_json_response_cleaner(self):
        """Verify code reviewer handles GPT markdown json code block wraps."""
        wrapped_json = "```json\n{\n  \"score\": 95,\n  \"summary\": \"Clean code\"\n}\n```"
        cleaned = reviewer.clean_json_response(wrapped_json)
        self.assertEqual(cleaned["score"], 95)
        self.assertEqual(cleaned["summary"], "Clean code")

    def test_04_rag_engine_cosine_similarity(self):
        """Test RAG document matching mathematical cosine calculations."""
        # Insert a dummy standards document
        doc_id = models.add_standards_document(
            title="Test PEP8 Indent",
            category="PYTHON",
            content_chunk="Always use 4 spaces per indentation level. Do not mix tabs and spaces.",
            metadata_dict=None
        )
        self.assertIsNotNone(doc_id)
        
        # Store mock 1536-dim vectors in DB manually for verification
        # Vector A: [1, 0, 0, ...]
        vector_a = [0.0] * 1536
        vector_a[0] = 1.0
        
        conn = database.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE standards_documents SET metadata_json = ? WHERE id = ?",
            (json.dumps(vector_a), doc_id)
        )
        conn.commit()
        conn.close()

        # Query using a vector that is identical to Vector A
        # Our query generator should return a vector. We stub get_embedding to return Vector A.
        original_get_embedding = rag_engine.get_embedding
        rag_engine.get_embedding = lambda x: vector_a

        matches = rag_engine.query_standards("Always use 4 spaces", category="PYTHON", limit=1)
        
        # Restore original function
        rag_engine.get_embedding = original_get_embedding

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["id"], doc_id)
        # Cosine similarity between two identical normalized vectors should be ~1.0
        self.assertAlmostEqual(matches[0]["similarity"], 1.0, places=4)

if __name__ == "__main__":
    unittest.main()
