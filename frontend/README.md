## Description
TaskFlow is a full-stack productivity application built with React, Flask, and PostgreSQL. It allows users to create, read, update, and delete tasks with secure authentication and ownership-based access control. Each user can only access their own tasks, ensuring data privacy and security.

## Technologies Used
- **Frontend:** React, React Router, Axios
- **Backend:** Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-CORS, Flask-JWT-Extended
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)

## Setup Instructions

### Prerequisites
- Node.js and npm
- Python 3.8+
- PostgreSQL

### Backend Setup
1. Navigate to the backend directory: cd backend
2. Create and activate a virtual environment: python3 -m venv venv on windows: venv/Scripts/activate
3. Install dependencies: pip install -r requirements.txt
4. Create the PostgreSQL database: createdb taskflow_db
5. Update the `.env` file with your database URL and JWT secret.
6. Run database migrations: flask db init flask db migrate -m "Initial migration" flask db upgrade
7. Start the Flask server: python app.py

### Frontend Setup
1. Navigate to the frontend directory: cd frontend
2. Install dependencies: npm install
3. Start the development server: npm run dev

The frontend will run on http://localhost:5173

## Core Features
- User registration and login with JWT authentication
- Create new tasks with title, description, and status
- View all tasks with pagination
- Edit existing tasks
- Delete tasks
- Tasks are owned by users and cannot be accessed by others

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login and receive JWT token
- `GET /api/me` - Get current user information

### Tasks (Protected)
- `GET /api/tasks?page=1&per_page=10` - Get paginated tasks for current user
- `GET /api/tasks/<id>` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/<id>` - Update a task
- `DELETE /api/tasks/<id>` - Delete a task

## Pagination
The GET /api/tasks endpoint supports pagination with `page` and `per_page` query parameters.

## Deployment
This application can be deployed using Render for the backend and Netlify or Vercel for the frontend.

## Future Improvements
- Add due dates and priorities to tasks
- Add categories or tags for task organization
- Implement search and filtering
- Add a user dashboard with statistics
