import os
import hmac
import hashlib
from flask import request, jsonify
from github import Github
from dotenv import load_dotenv
import reviewer
import models

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")

def verify_webhook_signature(data: bytes, signature: str) -> bool:
    """Verifies that the webhook payload matches the signature sent by GitHub."""
    if not GITHUB_WEBHOOK_SECRET:
        # If no secret is configured, bypass verification for testing
        return True
    if not signature:
        return False
        
    sha_name, signature = signature.split('=')
    if sha_name != 'sha256':
        return False
        
    mac = hmac.new(GITHUB_WEBHOOK_SECRET.encode('utf-8'), msg=data, digestmod=hashlib.sha256)
    return hmac.compare_digest(mac.hexdigest(), signature)

def handle_github_webhook(payload: dict):
    """
    Processes the GitHub webhook payload for Pull Request events.
    Fetches the changed code, reviews it, and posts the report back to GitHub.
    """
    # Look only for PR creation or updates
    action = payload.get("action")
    if action not in ["opened", "synchronize", "reopened"]:
        return {"status": "ignored", "reason": f"Action {action} is not analyzed."}

    pr_data = payload.get("pull_request")
    if not pr_data:
        return {"status": "error", "reason": "No pull request data found."}

    repo_data = payload.get("repository")
    repo_full_name = repo_data.get("full_name")
    github_repo_id = repo_data.get("id")
    pr_number = payload.get("number")
    commit_sha = pr_data.get("head", {}).get("sha")
    
    # 1. Fetch our local integrated repository configuration to find which user owns it
    local_repo = models.get_repo_by_github_id(github_repo_id)
    user_id = local_repo["user_id"] if local_repo else 1 # Default to main user (ID 1) if not integrated yet

    # 2. Authenticate to GitHub
    if not GITHUB_TOKEN or "your_github_token" in GITHUB_TOKEN:
        print("GitHub Token not configured. Webhook review cannot post comments.")
        return {"status": "error", "reason": "GitHub token not configured on server."}

    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(repo_full_name)
        pr = repo.get_pull(pr_number)
        
        # Fetch files changed in the PR
        files = pr.get_files()
        
        all_issues = []
        scores = []
        
        for file in files:
            # We only review code files (Python, JS, TS, HTML, CSS, C++, Java, Go)
            filename = file.filename
            # Ignore standard config, documentation, and lock files
            if any(filename.endswith(ext) for ext in [".md", ".json", ".lock", ".png", ".jpg", ".txt"]):
                continue
                
            # Fetch raw file contents from the patch or download the raw content
            try:
                # Get raw content of file at current PR head
                raw_content = repo.get_contents(filename, ref=commit_sha).decoded_content.decode("utf-8")
                
                # Detect language based on extension
                ext = filename.split(".")[-1]
                language_map = {
                    "py": "Python", "js": "JavaScript", "ts": "TypeScript",
                    "html": "HTML", "css": "CSS", "cpp": "C++", "java": "Java", "go": "Go"
                }
                language = language_map.get(ext, "Text")
                
                # Execute Code Review (this saves it in SQLite)
                review_id = reviewer.review_code(
                    code_content=raw_content,
                    language=language,
                    file_path=filename,
                    user_id=user_id,
                    repo_id=local_repo["id"] if local_repo else None,
                    commit_sha=commit_sha,
                    pr_number=pr_number
                )
                
                # Retrieve issues and score
                review = models.get_review_by_id(review_id)
                issues = models.get_issues_by_review(review_id)
                
                scores.append(review["score"])
                all_issues.extend(issues)
            except Exception as e:
                print(f"Error processing file {filename} in PR webhook: {e}")
                continue

        if not scores:
            return {"status": "success", "reason": "No code files to review."}

        # 3. Formulate a beautiful markdown report comment on the Pull Request
        average_score = int(sum(scores) / len(scores))
        
        # Determine score status emoji
        score_emoji = "🔴"
        if average_score >= 85:
            score_emoji = "🟢"
        elif average_score >= 60:
            score_emoji = "🟡"

        comment_body = f"## {score_emoji} LLM Code Review Report Card\n\n"
        comment_body += f"**Overall Code Quality Score: {average_score} / 100**\n"
        comment_body += f"Analyzed **{len(scores)}** source file(s) for commit `{commit_sha[:8]}`.\n\n"
        
        if all_issues:
            comment_body += "### 🔍 Flagged Issues\n\n"
            comment_body += "| File | Line | Category | Severity | Explanation |\n"
            comment_body += "| :--- | :--- | :--- | :--- | :--- |\n"
            
            for issue in all_issues:
                sev_icon = "⚠️" if issue["severity"] == "High" else ("ℹ️" if issue["severity"] == "Low" else "⚡")
                comment_body += f"| `{issue['file_path']}` | {issue['line_number'] or 'Global'} | `{issue['category']}` | {sev_icon} **{issue['severity']}** | {issue['explanation']} |\n"
            
            comment_body += "\n### 🛠️ Suggested Refactorings & Fixes\n\n"
            for index, issue in enumerate(all_issues):
                if issue["suggested_fix"] or issue["improved_code"]:
                    comment_body += f"<details>\n<summary><b>Fix #{index+1}: {issue['file_path']} (Line {issue['line_number']})</b></summary>\n\n"
                    comment_body += f"**Suggested Fix:** {issue['suggested_fix']}\n\n"
                    if issue["improved_code"]:
                        ext = issue['file_path'].split('.')[-1]
                        comment_body += f"```python\n{issue['improved_code']}\n```\n"
                    comment_body += "</details>\n\n"
        else:
            comment_body += "✨ **Excellent work! No major bugs, security issues, or code smells were detected.**\n"
            
        comment_body += "\n---\n*Report generated automatically by LLM Code Review Bot.*"

        # Post the comment back to the GitHub PR thread
        pr.create_issue_comment(comment_body)
        return {"status": "success", "issues_count": len(all_issues), "average_score": average_score}

    except Exception as e:
        print(f"Error handling GitHub webhook logic: {e}")
        return {"status": "error", "reason": str(e)}
