# IT Help Desk Ticket System

A full-stack IT help desk ticket management application built with React, Node.js, Express, and PostgreSQL.

The application includes a user portal for submitting support tickets and a technician portal for searching, filtering, updating, and deleting tickets.

## Live Demo

- **Frontend:** https://it-helpdesk-ticket-system-1.onrender.com
- **Backend API:** https://it-helpdesk-ticket-system-0kzm.onrender.com
- **API Health Check:** https://it-helpdesk-ticket-system-0kzm.onrender.com/api/health

> The backend is hosted on Render's free tier, so it may take a short time to start after a period of inactivity.

## Features

### User Portal

- Submit a new IT support ticket
- Enter a name, email, title, category, priority, and description
- Validate required form fields
- Automatically assign new tickets an `open` status
- Display loading states while tickets are being submitted
- Display success and error messages

### Technician Portal

- View submitted support tickets
- Search ticket titles and descriptions
- Filter tickets by status
- Filter tickets by priority
- Filter tickets by category
- Sort tickets by newest, oldest, priority, or status
- Update ticket status
- Delete tickets
- View ticket creation dates
- Paginate through ticket results
- Select the number of tickets shown per page
- View the total number of matching tickets

## Technologies Used

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS
- Fetch API

### Backend

- Node.js
- Express
- PostgreSQL
- node-postgres
- REST API
- CORS
- dotenv

### Deployment

- Render Static Site for the React frontend
- Render Web Service for the Express backend
- Neon for the hosted PostgreSQL database

## Project Structure

```text
IT-Helpdesk-Ticket-System/
├── backend/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   │   ├── TechnicianPage.jsx
│   │   │   └── UserPage.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── config.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## API Endpoints

### Get all tickets

```http
GET /api/tickets
```

Supported query parameters:

| Parameter | Description |
|---|---|
| `search` | Searches ticket titles and descriptions |
| `status` | Filters tickets by status |
| `priority` | Filters tickets by priority |
| `category` | Filters tickets by category |
| `sort` | Sorts tickets by newest, oldest, priority, or status |
| `page` | Selects the current page |
| `limit` | Sets the number of tickets per page |

Example request:

```http
GET /api/tickets?status=open&priority=high&sort=newest&page=1&limit=10
```

Example response:

```json
{
  "page": 1,
  "limit": 10,
  "count": 1,
  "totalTickets": 1,
  "totalPages": 1,
  "tickets": [
    {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "title": "Laptop will not start",
      "category": "Hardware",
      "description": "The laptop does not turn on.",
      "priority": "high",
      "status": "open",
      "created_at": "2026-07-16T12:00:00.000Z",
      "updated_at": "2026-07-16T12:00:00.000Z"
    }
  ]
}
```

### Get one ticket

```http
GET /api/tickets/:id
```

Example:

```http
GET /api/tickets/1
```

### Create a ticket

```http
POST /api/tickets
```

Example request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "title": "Laptop will not start",
  "category": "Hardware",
  "description": "The laptop does not turn on after pressing the power button.",
  "priority": "high"
}
```

New tickets are automatically assigned the following status:

```text
open
```

If a priority is not provided, the default priority is:

```text
low
```

### Update a ticket

```http
PUT /api/tickets/:id
```

The endpoint supports partial updates.

Example request body:

```json
{
  "status": "in progress"
}
```

### Delete a ticket

```http
DELETE /api/tickets/:id
```

Example:

```http
DELETE /api/tickets/1
```

### Health check

```http
GET /api/health
```

This endpoint verifies that the Express API and PostgreSQL database are connected.

Example response:

```json
{
  "message": "API and database are connected"
}
```

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'low',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Allowed Ticket Values

### Categories

```text
Hardware
Software
Network
Account
Other
```

### Priorities

```text
low
medium
high
urgent
```

### Statuses

```text
open
in progress
resolved
closed
```

## Running the Project Locally

### Prerequisites

Install the following software:

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/dinhanh0/IT-Helpdesk-Ticket-System.git
cd IT-Helpdesk-Ticket-System
```

### 2. Create the local PostgreSQL database

Create a PostgreSQL database for the project.

Then create the `tickets` table:

```sql
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'low',
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Configure the backend environment variables

Create this file:

```text
backend/.env
```

Add the following variables:

```env
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
```

Do not commit the `.env` file to GitHub.

### 4. Install and run the backend

Open a terminal and run:

```bash
cd backend
npm install
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

Test the API health route:

```text
http://localhost:5000/api/health
```

### 5. Install and run the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

## Frontend Environment Configuration

The frontend uses the following configuration:

```js
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
```

During local development, the application falls back to:

```text
http://localhost:5000
```

For production, the frontend uses:

```env
VITE_API_URL=https://it-helpdesk-ticket-system-0kzm.onrender.com
```

## Backend Production Environment Variables

The deployed backend uses the following environment variables:

```env
DATABASE_URL=your_neon_postgresql_connection_string
NODE_ENV=production
FRONTEND_URL=https://it-helpdesk-ticket-system-1.onrender.com
```

Private values such as the database connection string should only be stored in environment variables and should never be committed to GitHub.

## Security

The project includes several basic security practices:

- PostgreSQL queries use parameterized placeholders
- Database credentials are stored in environment variables
- The production frontend URL is restricted through CORS
- User input is validated before database operations
- Allowed ticket categories, priorities, statuses, and sorting values are validated by the backend
- The `.env` file is excluded from GitHub

## What I Learned

Through this project, I gained experience with:

- Building a full-stack application using React, Express, and PostgreSQL
- Designing and implementing REST API endpoints
- Connecting a React frontend to an Express backend
- Writing parameterized SQL queries
- Implementing CRUD operations
- Implementing filtering, searching, sorting, and pagination
- Managing loading, success, and error states in React
- Creating reusable React page components
- Passing data between React components using props
- Using environment variables for local and production configuration
- Configuring CORS between deployed services
- Deploying a frontend, backend, and database as separate services
- Debugging production environment variables and network requests

## Future Improvements

- Add technician authentication
- Add separate user accounts
- Allow users to track their submitted tickets
- Add ticket assignment to technicians
- Add technician comments and internal notes
- Add file attachments
- Add email notifications
- Add password reset functionality
- Add dashboard statistics and charts
- Add automated frontend and backend tests
- Add API rate limiting
- Improve accessibility
- Improve mobile responsiveness
- Add ticket editing functionality
- Add ticket history and audit logs

## Author

**Anh Dinh**

Computer Science graduate interested in software engineering, full-stack development, cloud technologies, and IT systems.
