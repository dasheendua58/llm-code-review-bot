# OWASP Security Coding Guidelines

## Injection Prevention
- Never concatenate untrusted user inputs directly into SQL queries. Always use parameterized queries (prepared statements) to prevent SQL Injection.
- Sanitize and validate all inputs using allow-lists of allowed characters.
- Avoid running system commands using shell execution functions (e.g., Python's `os.system` or `subprocess.Popen(..., shell=True)`) with user input. Use safe APIs or validate parameters strictly.

## Cryptography and Sensitive Data Protection
- Never hardcode API keys, passwords, database credentials, or secret keys in source code files. Use environment variables or secret managers.
- Always use strong, modern cryptographic algorithms. Avoid outdated hash functions like MD5 or SHA1 for password hashing; use bcrypt, PBKDF2, or Argon2.
- Use HTTPS for all network communications to encrypt data in transit.

## Broken Access Control and Authentication
- Ensure JWT tokens are securely signed with a strong secret key. Verify signatures, expiration claims (`exp`), and issuers.
- Implement proper authorization checks at the API controller level. Never rely solely on frontend hidden elements or obscure URLs for security.
- Prevent Cross-Site Scripting (XSS) by encoding outputs before rendering them in HTML pages, and use Content Security Policies (CSP).
