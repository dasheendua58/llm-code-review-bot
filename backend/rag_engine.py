import os
import json
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from database import get_db_connection
import models

load_dotenv()

# Initialize OpenAI client
client = None
def get_openai_client():
    global client
    if client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and "your_openai_api_key" not in api_key:
            client = OpenAI(api_key=api_key)
    return client

def get_embedding(text: str):
    """Generates an embedding vector using OpenAI's API. Fallback to a zero-vector if key is missing."""
    openai_client = get_openai_client()
    if openai_client:
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating OpenAI embedding: {e}")
    
    # Fallback/Mock embedding: simple hash-based vector (so it runs without API keys too)
    # Size 1536 for compatibility with text-embedding-3-small
    np.random.seed(hash(text) % (2**32 - 1))
    return np.random.randn(1536).tolist()

def initialize_rag_database():
    """Reads coding standard files, chunks them using LangChain, embeds them, and saves to SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if documents already indexed
    cursor.execute("SELECT COUNT(*) FROM standards_documents")
    count = cursor.fetchone()[0]
    if count > 0:
        print("RAG standards database is already populated.")
        conn.close()
        return

    standards_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "standards_docs")
    if not os.path.exists(standards_dir):
        print(f"Standards directory not found at {standards_dir}")
        conn.close()
        return

    # Initialize LangChain text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len
    )

    documents_indexed = 0
    for filename in os.listdir(standards_dir):
        if filename.endswith(".md"):
            filepath = os.path.join(standards_dir, filename)
            category = filename.replace(".md", "").upper()
            
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Split the document content
            chunks = text_splitter.split_text(content)
            print(f"Splitting {filename} into {len(chunks)} chunks...")
            
            for index, chunk in enumerate(chunks):
                title = f"{filename} - Chunk {index + 1}"
                embedding = get_embedding(chunk)
                embedding_json = json.dumps(embedding)
                
                cursor.execute(
                    """INSERT INTO standards_documents (title, category, content_chunk, metadata_json) 
                       VALUES (?, ?, ?, ?)""",
                    (title, category, chunk, embedding_json)
                )
                documents_indexed += 1

    conn.commit()
    conn.close()
    print(f"RAG system initialized. {documents_indexed} standard chunks indexed.")

def query_standards(query_text: str, category: str = None, limit: int = 3):
    """
    Retrieves the top-k relevant coding standard chunks.
    Computes cosine similarity between the query embedding and stored document embeddings.
    """
    query_vector = np.array(get_embedding(query_text))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if category:
        cursor.execute("SELECT id, title, category, content_chunk, metadata_json FROM standards_documents WHERE category = ?", (category.upper(),))
    else:
        cursor.execute("SELECT id, title, category, content_chunk, metadata_json FROM standards_documents")
        
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return []

    results = []
    for row in rows:
        # Load embedding from DB
        meta_str = row["metadata_json"]
        if not meta_str:
            continue
        try:
            doc_vector = np.array(json.loads(meta_str))
            # Compute Cosine Similarity
            dot_prod = np.dot(query_vector, doc_vector)
            norm_q = np.linalg.norm(query_vector)
            norm_d = np.linalg.norm(doc_vector)
            similarity = dot_prod / (norm_q * norm_d) if norm_q > 0 and norm_d > 0 else 0
            
            results.append({
                "id": row["id"],
                "title": row["title"],
                "category": row["category"],
                "content_chunk": row["content_chunk"],
                "similarity": float(similarity)
            })
        except Exception as e:
            print(f"Error computing similarity for row {row['id']}: {e}")
            continue

    # Sort by similarity descending
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:limit]

if __name__ == "__main__":
    # Test initialization
    initialize_rag_database()
    # Test search query
    matches = query_standards("sql injection prevention in code", limit=2)
    print("\nTest matches:")
    for m in matches:
        print(f"- {m['title']} (Score: {m['similarity']:.4f}):\n  {m['content_chunk'][:100]}...\n")
