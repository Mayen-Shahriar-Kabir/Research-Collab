# Research Collaboration Platform

A full-stack web application designed to connect students and faculty
members, support research-project discovery and collaboration, and help
manage project activities. The platform includes academic-interest-based
matching, project applications, task tracking, messaging, notifications,
bookmarks, certificates, and research lab computer access management.

## Features

### User accounts and profiles

-   Register and log in as a student or faculty member.
-   Maintain academic profiles with department, institution, program,
    academic interests, and other profile information.
-   Submit requests for a role change.
-   Upload and manage profile photos.
-   Administer user accounts and account status.

### Research project management

-   Faculty members can create and manage research projects.
-   Browse and search available projects.
-   View project descriptions, domains, requirements, deadlines, and
    availability.
-   Students can apply to projects and provide an application message,
    CV, and sample work.
-   Faculty can review applications and update their status.
-   Manage project milestones, stages, documents, and progress.

### Academic-interest matching

-   Suggest faculty members to students, and students to faculty
    members, based on shared academic interests.
-   View common interests and matching suggestions.
-   Rank suggestions by the number of matching interests.

### Collaboration and communication

-   Create and assign project tasks.
-   Track task status, priority, due dates, updates, and submitted work.
-   Review task submissions and provide feedback.
-   Send and receive direct messages.
-   Receive notifications about platform activities.
-   Bookmark projects for later reference.

### Research facilities and administration

-   Manage research lab computers and their information.
-   Submit and manage lab-access and computer-use requests.
-   Request project timeline extensions.
-   Review and manage users and administrative requests.
-   Issue project-completion certificates.

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, React Router, HTML, CSS, JavaScript |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |
| **File Uploads** | Multer |
| **Configuration** | dotenv |
| **HTTP Communication** | Axios |

## Project Structure

``` text
Research-Collab-main/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── config.js
│   └── package.json
└── README.md
```

## Prerequisites

Install the following before running the application:

-   Node.js (LTS version recommended)
-   npm
-   MongoDB database (local MongoDB server or MongoDB Atlas)
-   Git

## Getting Started

### 1. Clone the repository

``` bash
git clone https://github.com/Mayen-Shahriar-Kabir/Research-Collab.git
cd Research-Collab
```


### 2. Configure the backend

Open a terminal in the backend directory:

``` bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

``` env
MONGO_URL=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_long_random_secret
```

-   `MONGO_URL`: MongoDB connection string for your database.
-   `PORT`: Port on which the Express server will run. The application
    defaults to `5001` if this variable is not set.
-   `JWT_SECRET`: A strong, private secret used to sign and verify
    authentication tokens.


Start the backend:

``` bash
npm start
```

The API server will run at:

``` text
http://localhost:5001
```

### 3. Configure the frontend

Open another terminal in the project root and navigate to the frontend
directory:

``` bash
cd frontend
npm install
```

The frontend reads its API base URL from `REACT_APP_API_BASE_URL`.
Create a `.env` file inside `frontend` if you need to override the
configured API address:

``` env
REACT_APP_API_BASE_URL=http://localhost:5001/api
```

If this variable is not set, the current frontend configuration uses the
hosted API URL defined as its fallback in `frontend/src/config.js`.

Start the React development server:

``` bash
npm start
```

The frontend will be available at:

``` text
http://localhost:3000
```

Keep the backend server and MongoDB database running while using the
application.

## Main Frontend Routes

The React application defines the following main routes:

| Route | Purpose |
|---|---|
| `/login` | User login |
| `/register` | User registration |
| `/home` | Home page |
| `/user` | User area |
| `/profile` | Profile management |
| `/projects` | Browse research projects |
| `/projects/new` | Create a research project |
| `/project-management` | Project management |
| `/applications-review` | Review project applications |
| `/tasks` | Task management |
| `/bookmarks` | Bookmarked projects |
| `/messages` | Direct messaging |
| `/notifications` | Notifications |
| `/dashboard` | Dashboard |
| `/certificates` | Certificates |
| `/role-request` | Role request |
| `/pc-requests` | Computer/lab requests |
| `/admin/users` | Admin user management |
| `/admin/pc` | Admin computer management |

**Note:** Some pages and actions require authentication and appropriate user permissions.

## User Roles

The application uses three primary roles:

-   **Student:** Maintains an academic profile, discovers research
    opportunities, applies to projects, collaborates on assigned work,
    and communicates with faculty.
-   **Faculty:** Publishes research projects, reviews student
    applications, supervises project activities, assigns tasks, and
    collaborates with students.
-   **Admin:** Manages users and administrative resources and reviews
    relevant platform requests.

## Available Scripts

### Backend

Run from the `backend` directory:

``` bash
npm start
```

Starts the Express API server.

### Frontend

Run from the `frontend` directory:

``` bash
npm start
```

Starts the React development server.

``` bash
npm run build
```

Creates an optimized production build.

``` bash
npm test
```

Runs the configured React test runner.
