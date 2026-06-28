import os
import json
import secrets
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

import database
import models
import auth
import reviewer
import rag_engine
import github_integration

load_dotenv()

# Initialize Flask App
# Define templates and static folders to serve our React SPA frontend
app = Flask(
    __name__,
    template_folder=os.path.join("..", "frontend", "templates"),
    static_folder=os.path.join("..", "frontend", "static")
)
CORS(app)

# Absolute paths for file storage
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
REPORTS_DIR = os.path.join(_PROJECT_ROOT, "reports")

# Ensure folders exist
os.makedirs(REPORTS_DIR, exist_ok=True)

# Initialize Database and RAG on Startup
database.init_db()
rag_engine.initialize_rag_database()


# --- FRONTEND ROUTING ---

@app.route("/")
def index():
    """Serves the single-page React application."""
    return render_template("index.html")


# --- AUTHENTICATION ENDPOINTS ---

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "Username, email, and password are required."}), 400

    # Hash password
    pw_hash = auth.hash_password(password)
    
    # Save user to DB
    user_id = models.create_user(username, email, pw_hash)
    if not user_id:
        return jsonify({"message": "Username or Email already exists."}), 400

    token = auth.generate_token(user_id, username)
    return jsonify({
        "message": "User registered successfully.",
        "token": token,
        "user": {"id": user_id, "username": username, "email": email}
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required."}), 400

    user = models.get_user_by_username(username)
    if not user or not auth.verify_password(user["password_hash"], password):
        return jsonify({"message": "Invalid username or password."}), 401

    token = auth.generate_token(user["id"], user["username"])
    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]}
    }), 200


# --- CODE REVIEW ENDPOINTS ---

@app.route("/api/reviews/paste", methods=["POST"])
@auth.token_required
def review_paste(current_user):
    data = request.get_json() or {}
    code_content = data.get("code")
    language = data.get("language", "Python")
    filename = data.get("filename", "pasted_code.txt")

    if not code_content:
        return jsonify({"message": "Code content cannot be empty."}), 400

    try:
        review_id = reviewer.review_code(
            code_content=code_content,
            language=language,
            file_path=filename,
            user_id=current_user["id"]
        )
        return jsonify({
            "message": "Code review completed successfully.",
            "review_id": review_id
        }), 201
    except Exception as e:
        return jsonify({"message": "Error conducting code review.", "error": str(e)}), 500

@app.route("/api/reviews/upload", methods=["POST"])
@auth.token_required
def review_upload(current_user):
    if 'file' not in request.files:
        return jsonify({"message": "No file uploaded."}), 400
        
    file = request.files['file']
    filename = file.filename
    if filename == '':
        return jsonify({"message": "File name cannot be empty."}), 400

    language = request.form.get("language", "Python")
    
    try:
        code_content = file.read().decode("utf-8")
        review_id = reviewer.review_code(
            code_content=code_content,
            language=language,
            file_path=filename,
            user_id=current_user["id"]
        )
        return jsonify({
            "message": f"File '{filename}' reviewed successfully.",
            "review_id": review_id
        }), 201
    except Exception as e:
        return jsonify({"message": "Failed to read or review file.", "error": str(e)}), 500

@app.route("/api/reviews", methods=["GET"])
@auth.token_required
def get_reviews_history(current_user):
    history = models.get_reviews_by_user(current_user["id"])
    return jsonify(history), 200

@app.route("/api/reviews/<int:review_id>", methods=["GET"])
@auth.token_required
def get_review_details(current_user, review_id):
    review = models.get_review_by_id(review_id)
    if not review or review["user_id"] != current_user["id"]:
        return jsonify({"message": "Review not found."}), 404
        
    issues = models.get_issues_by_review(review_id)
    return jsonify({
        "review": review,
        "issues": issues
    }), 200


# --- PDF REPORT GENERATION ---

@app.route("/api/reviews/<int:review_id>/pdf", methods=["GET"])
@auth.token_required
def download_pdf_report(current_user, review_id):
    review = models.get_review_by_id(review_id)
    if not review or review["user_id"] != current_user["id"]:
        return jsonify({"message": "Review not found."}), 404
        
    issues = models.get_issues_by_review(review_id)
    pdf_path = os.path.join(REPORTS_DIR, f"report_{review_id}.pdf")

    try:
        # Generate PDF report
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor("#1A365D"),
            spaceAfter=20
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#718096"),
            spaceAfter=15
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor("#2C5282"),
            spaceBefore=15,
            spaceAfter=10
        )
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['BodyText'],
            fontSize=11,
            leading=14,
            spaceAfter=8
        )

        elements = []
        
        # Header Elements
        elements.append(Paragraph("LLM-Powered Code Review Bot Report", title_style))
        elements.append(Paragraph(f"Generated on: {review['created_at']} | Review ID: #{review_id}", subtitle_style))
        
        # Scorecard
        score_color = "#48BB78" if review['score'] >= 85 else ("#ECC94B" if review['score'] >= 60 else "#F56565")
        score_text = f"<font size='16' color='{score_color}'><b>Score: {review['score']} / 100</b></font>"
        elements.append(Paragraph(score_text, body_style))
        elements.append(Spacer(1, 10))
        
        # Summary Section
        elements.append(Paragraph("Code Summary & Refactoring Feedback", section_heading))
        elements.append(Paragraph(review["summary"].replace("\n", "<br/>"), body_style))
        elements.append(Spacer(1, 15))
        
        # Flagged Issues
        elements.append(Paragraph("Flagged Issues Details", section_heading))
        
        if not issues:
            elements.append(Paragraph("No issues flagged. Outstanding code quality!", body_style))
        else:
            table_data = [["File", "Line", "Severity", "Category", "Explanation"]]
            for issue in issues:
                table_data.append([
                    issue["file_path"],
                    str(issue["line_number"] or "Global"),
                    issue["severity"],
                    issue["category"],
                    issue["explanation"]
                ])
            
            # Render Table
            t = Table(table_data, colWidths=[110, 40, 60, 70, 240])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B6CB0")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 10),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#F7FAFC")),
                ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('FONTSIZE', (0,1), (-1,-1), 9),
            ]))
            elements.append(t)
            
        doc.build(elements)
        return send_file(pdf_path, as_attachment=True)
    except Exception as e:
        return jsonify({"message": "Failed to generate PDF.", "error": str(e)}), 500


# --- GITHUB INTEGRATION WEBHOOK & REPOS ---

@app.route("/api/github/webhook", methods=["POST"])
def github_webhook():
    signature = request.headers.get("X-Hub-Signature-256")
    data = request.get_data()
    
    if not github_integration.verify_webhook_signature(data, signature):
        return jsonify({"message": "Invalid signature verification."}), 403

    payload = request.get_json()
    result = github_integration.handle_github_webhook(payload)
    return jsonify(result), 200

@app.route("/api/github/repos", methods=["GET"])
@auth.token_required
def get_integrated_repos(current_user):
    repos = models.get_repositories_by_user(current_user["id"])
    return jsonify(repos), 200

@app.route("/api/github/repos/integrate", methods=["POST"])
@auth.token_required
def integrate_repo(current_user):
    data = request.get_json() or {}
    repo_name = data.get("repo_name")
    github_repo_id = data.get("github_repo_id")
    webhook_secret = data.get("webhook_secret", secrets.token_hex(16))

    if not repo_name:
        return jsonify({"message": "Repository name is required."}), 400

    repo_id = models.add_repository(
        user_id=current_user["id"],
        repo_name=repo_name,
        github_repo_id=github_repo_id,
        webhook_secret=webhook_secret
    )
    
    if not repo_id:
        return jsonify({"message": "Repository is already integrated."}), 400

    return jsonify({
        "message": "Repository integrated successfully.",
        "repo_id": repo_id,
        "webhook_secret": webhook_secret
    }), 201


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
