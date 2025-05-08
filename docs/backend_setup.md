# Django Backend Setup and Troubleshooting

This document provides instructions for setting up and starting the Django backend for the UniHub platform.

## Setup Instructions

### 1. Virtual Environment Setup

First, set up a Python virtual environment to isolate your dependencies:

```bash
# Navigate to the project root
cd /Users/ibrahimamir/Documents/DESD

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # On Unix/macOS
# OR
venv\Scripts\activate     # On Windows
```

### 2. Install Dependencies

```bash
# Install Django and other dependencies
pip install -r backend/requirements.txt
```

### 3. Database Setup

```bash
# Navigate to the backend directory
cd backend

# Run migrations
python manage.py migrate
```

### 4. Create Admin User (Optional)

```bash
# Create a superuser to access the admin panel
python manage.py createsuperuser
```

### 5. Run the Development Server

```bash
# Start the Django development server
python manage.py runserver 8000
```

The server should now be running at http://localhost:8000/

## Troubleshooting Common Issues

### "No module named 'django'"

This error occurs when Django is not installed in your current Python environment:

1. Ensure you've activated the virtual environment
2. Check if Django is installed: `pip list | grep Django`
3. If not, install it: `pip install django`

### Database Connection Errors

If you experience database connection issues:

1. Check the database configuration in `backend/settings.py`
2. Ensure the database server is running
3. Try running `python manage.py dbshell` to test the connection

### API Errors in the Frontend

If the frontend shows API connection errors:

1. Check if the Django server is running (look for it with `ps aux | grep runserver`)
2. Verify the API URL configuration in the frontend
3. Check for CORS issues in the browser console
4. Test API endpoints directly using a tool like curl or Postman

### Migrations Issues

If you experience problems with migrations:

```bash
# Reset migrations (use with caution as this will delete data)
python manage.py flush

# Make new migrations if models have changed
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

## Running Backend in Different Environments

### Development

```bash
python manage.py runserver 8000
```

### Production

In production, you should use a WSGI server like gunicorn:

```bash
pip install gunicorn
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
```

## Enabling Debug Mode

To get more detailed error messages:

1. Edit `backend/settings.py`
2. Set `DEBUG = True`
3. Restart the server

## Checking the Backend Logs

If you encounter issues, check the logs:

```bash
# With the server running, look at the console output
# Or check for log files in the specified log directory
```

## Running Backend Tests

```bash
# Run tests for the communities app
python manage.py test communities
```

## Using the Mock Mode When Backend is Unavailable

If you need to develop or test the frontend without the backend:

1. Open the browser console
2. Set up local storage: `localStorage.setItem('use_mock_services', 'true')`
3. Refresh the page - the frontend will now use mock data instead of real API calls 