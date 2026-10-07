# DebugMind AI – Server

This folder contains the backend REST API for **DebugMind AI**, an intelligent bug tracking and AI-assisted code review platform.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcrypt
- Zod
- Multer
- Swagger
- Ollama / AI-assisted analysis and repair

## Project Structure

```text
Server/
├── config/
├── controllers/
├── database/
├── middleware/
├── routes/
├── services/
├── utils/
├── validators/
├── app.js
├── server.js
├── package.json
├── nodemon.json
└── README.md
```

## Main Features

- User authentication and authorization
- Role-based access control
- Project management
- GitHub project integration
- ZIP project upload
- Project source analysis
- AI-based bug detection
- Bug management
- AI-assisted code repair
- Bug comments
- Team member management
- Dashboard statistics
- File attachments
- Source fingerprint validation
- REST API

## User Roles

The system supports the following roles:

- **Admin**
- **Project Manager**
- **Developer**
- **Tester**

## Database

The backend uses **PostgreSQL** for storing:

- Users
- Projects
- Bugs
- AI analysis results
- Comments
- Members
- Attachments

Database configuration is stored in environment variables.

## Installation

Navigate to the Server folder:

```bash
cd Server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file and configure the required environment variables.

> Do not upload the `.env` file to GitHub.

## Run the Server

For development:

```bash
npm run dev
```

Or start the server normally:

```bash
npm start
```

## AI Integration

DebugMind AI supports AI-assisted source-code analysis and repair.

The backend contains dedicated services for:

- AI bug analysis
- AI-generated repair suggestions
- Applying code fixes

The project can also use a local LLM through **Ollama** for AI-assisted development without exposing API credentials in the repository.

## Security

The backend uses:

- JWT authentication
- Password hashing with bcrypt
- Role-based authorization
- Input validation using Zod
- Environment variables for sensitive configuration

## API

The backend provides REST API endpoints for:

```text
/api/auth
/api/projects
/api/ai-projects
/api/bugs
/api/dashboard
/api/members
/api/comments
/api/attachments
```

## Project

**DebugMind AI – Intelligent Bug Tracking & Code Review Platform**

Developed as a full-stack project using Node.js, Express.js and PostgreSQL.

## 🌐 Live Demo

### Frontend – Vercel

**Live Application:**  


### Backend – Render

**Backend API:**  
