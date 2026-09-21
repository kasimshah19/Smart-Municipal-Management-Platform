# Smart Municipal Management Platform

A scalable MERN-based municipal management platform designed to help citizens report civic issues and access municipal services while allowing municipal departments, officers, inspectors, and field workers to manage operations efficiently.

---

## Current Phase

**Phase 1 — Project Foundation**

A clean, modular MERN architecture with completely separate client and server applications, ready for feature development in subsequent phases.

---

## Technology Stack

### Frontend

| Technology     | Purpose                  |
| -------------- | ------------------------ |
| React          | UI library               |
| Vite           | Build tool & dev server  |
| Tailwind CSS   | Utility-first CSS        |
| React Router   | Client-side routing      |
| Axios          | HTTP client              |
| Redux Toolkit  | State management         |
| ESLint         | Code quality             |

### Backend

| Technology     | Purpose                  |
| -------------- | ------------------------ |
| Node.js        | Runtime                  |
| Express.js     | Web framework            |
| MongoDB        | Database                 |
| Mongoose       | ODM                      |
| JWT            | Auth foundation          |
| dotenv         | Environment variables    |
| CORS           | Cross-origin requests    |
| Morgan         | Request logging          |
| Nodemon        | Dev auto-restart         |

---

## Architecture

```
React (Vite)
    ↓
  Axios
    ↓
Express API
    ↓
 Mongoose
    ↓
 MongoDB
```

---

## Folder Structure

```
smart-municipal-platform/
│
├── client/                         # React frontend application
│   ├── public/                     # Static public assets
│   ├── src/
│   │   ├── assets/                 # Images, icons, fonts
│   │   ├── components/             # Reusable UI components
│   │   ├── features/               # Feature modules (complaints, wards, etc.)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── layouts/                # Page layout wrappers
│   │   ├── pages/                  # Route-level page components
│   │   ├── routes/                 # React Router configuration
│   │   ├── services/               # API client (Axios instance)
│   │   ├── store/                  # Redux store configuration
│   │   ├── utils/                  # Helper / utility functions
│   │   ├── App.jsx                 # Root application component
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles & Tailwind imports
│   ├── .env.example                # Environment variable template
│   ├── index.html                  # HTML entry point
│   ├── vite.config.js              # Vite configuration
│   └── package.json                # Frontend dependencies
│
├── server/                         # Express backend application
│   ├── src/
│   │   ├── config/                 # Database & environment configuration
│   │   │   ├── db.js               # MongoDB connection
│   │   │   └── env.js              # Environment variable loader & validator
│   │   ├── controllers/            # Route handler functions
│   │   ├── middlewares/            # Express middleware (error handling, auth, etc.)
│   │   ├── models/                 # Mongoose schemas & models
│   │   ├── routes/                 # Express route definitions
│   │   ├── services/               # Business logic layer
│   │   ├── utils/                  # Server-side helper functions
│   │   ├── app.js                  # Express app configuration
│   │   └── server.js               # Server entry point
│   ├── .env.example                # Environment variable template
│   └── package.json                # Backend dependencies
│
├── .gitignore                      # Git ignore rules
├── package.json                    # Root scripts (concurrently)
└── README.md                       # This file
```

### Client Folder Purposes

| Folder         | Purpose |
| -------------- | ------- |
| `components/`  | Shared, reusable UI components (buttons, modals, cards, form inputs) |
| `pages/`       | Top-level page components mapped to routes |
| `layouts/`     | Page layout wrappers (header, sidebar, footer) shared across routes |
| `features/`    | Feature-based modules — each feature has its own components, Redux slice, and service |
| `services/`    | API client configuration (centralized Axios instance) |
| `hooks/`       | Custom React hooks for reusable stateful logic |
| `utils/`       | Pure helper functions (formatters, validators, constants) |
| `store/`       | Redux Toolkit store configuration and root setup |
| `routes/`      | React Router route definitions |
| `assets/`      | Static assets — images, icons, fonts |

### Server Folder Purposes

| Folder          | Purpose |
| --------------- | ------- |
| `config/`       | Database connection, environment variable loading |
| `controllers/`  | Request handlers — receive requests, return responses |
| `middlewares/`  | Express middleware — error handling, authentication, validation |
| `models/`       | Mongoose schemas and model definitions |
| `routes/`       | Route definitions — map URLs to controllers |
| `services/`     | Business logic layer — controllers delegate complex logic here |
| `utils/`        | Server-side helper functions |

---

## Local Setup

### Prerequisites

- **Node.js** (v18 or later)
- **MongoDB** (local instance or MongoDB Atlas)
- **npm**

### 1. Clone the repository

```bash
git clone <repository-url>
cd smart-municipal-platform
```

### 2. Install all dependencies

```bash
npm run install:all
```

Or install individually:

```bash
# Root (concurrently)
npm install

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Configure environment variables

**Backend** — create `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smart-municipal
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
```

**Frontend** — create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the backend

```bash
npm run server
```

The API starts at `http://localhost:5000`.

### 5. Start the frontend

```bash
npm run client
```

The app opens at `http://localhost:5173`.

### 6. Run both together

```bash
npm run dev
```

---

## API Health Check

Verify the backend is running:

```
GET http://localhost:5000/api/health
```

Response:

```json
{
  "success": true,
  "message": "Smart Municipal Platform API is running",
  "environment": "development"
}
```

---

## Future Phases

The architecture is designed to scale. Future modules will be added as feature folders:

```
features/
  complaints/
  wards/
  departments/
  workers/
  services/
  properties/
  taxes/
  inspections/
  notifications/
  analytics/
```

---

## License

This project is developed as a final-year academic project.
