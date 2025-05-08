# Uni Hub

Uni Hub is a platform for university students to manage their profiles, communities, and events. The project consists of a Django backend (using Django REST Framework) and a Next.js frontend, both running in Docker containers.

# Github repo url: 

https://github.com/AliEltouny/DESD


## Features

- User registration with email verification via OTP
- JWT-based authentication
- User profile management
- Dashboard to view user information

## Technology Stack

### Backend

- Django 5.1.x
- Django REST Framework
- PostgreSQL database
- JWT authentication (using djangorestframework-simplejwt)
- Docker

### Frontend

- Next.js 15.x with TypeScript
- React Query for API calls
- Axios for HTTP requests
- Tailwind CSS for styling
- Docker

## Project Structure

```
uni_hub/
├── backend/                # Django backend
│   ├── api/                # API app
│   ├── core/               # Core settings
│   ├── users/              # User management app
│   ├── Dockerfile          # Docker configuration for backend
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/                # Frontend source code
│   ├── public/             # Static assets
│   └── Dockerfile          # Docker configuration for frontend
└── docker-compose.yml      # Docker Compose configuration
```

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1. Clone the repository
2. Navigate to the project directory
3. Start the application with Docker Compose:

```bash
docker-compose up
```

The application will be accessible at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

## Development Workflow

### Backend Development

The Django backend is located in the `backend` directory. To start the backend server:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Development

The Next.js frontend is located in the `frontend` directory. To start the frontend development server:

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `/api/signup/` (POST): Register a new user
- `/api/verify-otp/<email>/` (POST): Verify OTP and activate user
- `/api/login/` (POST): Authenticate and return JWT tokens
- `/api/profile/` (GET, PATCH): Get and update user profile

## Frontend Routes

- `/`: Home page
- `/register`: User registration
- `/verify-otp/<email>`: OTP verification
- `/login`: User login
- `/dashboard`: User dashboard
- `/profile`: Profile management

## License

This project is licensed under the MIT License.
