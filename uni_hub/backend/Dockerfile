FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt .
# Install whitenoise dependencies first if any special ones are needed (usually not)
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Run collectstatic 
# --noinput avoids prompts, useful in non-interactive environments
RUN python manage.py collectstatic --noinput 

# Expose port for Django/Gunicorn
EXPOSE 8000

# Command to run the application (Gunicorn will be specified in docker-compose.prod.yml)
# Keep the development server CMD as a fallback if needed
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"] 