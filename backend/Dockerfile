# Use official slim Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Set work directory
WORKDIR /app

# Install system dependencies (needed for reportlab PDF generation fonts)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
# We copy everything, including templates and static folders
COPY . /app/

# Expose Flask API Port
EXPOSE 5000

# Run Flask application using Gunicorn (production grade WSGI)
# Gunicorn can be added to requirements.txt or run directly
RUN pip install gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
