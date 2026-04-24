# OrgSync

A full-stack organization task management application where multiple organizations can manage work in a shared platform while keeping data strictly isolated per tenant.

This project includes:

- a `Node.js + Express` backend
- a `PostgreSQL` database
- a `React + Vite` frontend
- `JWT`-based authentication
- `Docker` and `docker-compose` setup
- role-based access control for `admin` and `member`
- task activity tracking for visibility into changes over time

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Roles and Permissions](#roles-and-permissions)
- [Tenant Isolation Model](#tenant-isolation-model)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Running Locally Without Docker](#running-locally-without-docker)
- [Seeded Demo Accounts](#seeded-demo-accounts)
- [API Reference](#api-reference)
- [Frontend Behavior](#frontend-behavior)
- [Database Schema Summary](#database-schema-summary)
- [Activity Log Behavior](#activity-log-behavior)
- [Security Notes](#security-notes)
- [Current Limitations](#current-limitations)
- [Future Improvements](#future-improvements)

## Overview

The application is designed around a multi-tenant model:

- each user belongs to exactly one organization
- each task belongs to exactly one organization
- every authenticated request is scoped to the user’s `organization_id`
- users can never access data from another organization

The current product supports two role types:

- `admin`
- `member`

Admins manage users and tasks across their organization. Members work only on tasks assigned to them, and can update only task status.

## Core Features

- Organization-based tenant isolation
- JWT authentication with login and organization bootstrap registration
- Role-based access control
- Admin-only user creation inside an organization
- Task create, read, update, and delete flows
- Member-only assigned-task status updates
- Activity history for task creation, updates, and deletion
- Toast-based success and error notifications in the frontend
- Seeded sample organizations and users for quick testing
- Dockerized development and demo setup

## Architecture

### Backend

The backend exposes a REST API and is responsible for:

- authenticating users with JWT
- attaching the authenticated user to each request
- enforcing tenant isolation
- enforcing RBAC rules
- managing task data
- recording task activity logs

### Frontend

The frontend is a minimal task management UI that supports:

- login and organization registration
- viewing task lists
- viewing task details and activity history
- admin task creation and editing
- member task status updates
- admin demo-member creation

### Database

PostgreSQL stores:

- organizations
- users
- tasks
- task activity logs

## Tech Stack

### Backend

- Node.js
- Express
- PostgreSQL
- `pg`
- `jsonwebtoken`
- `bcryptjs`

### Frontend

- React
- Vite
- `react-hot-toast`

### DevOps

- Docker
- Docker Compose
- Nginx for frontend serving in the production container

## Roles and Permissions

### Admin

Admins can:

- create a new organization during registration
- log in and access their own organization
- view all tasks in their organization
- create tasks
- edit task title, description, status, and assignee
- delete tasks
- create organization users through the admin flow
- view task activity for tasks in their organization

### Member

Members can:

- log in and access only their own organization
- view tasks assigned to them
- view activity for tasks assigned to them
- update only the `status` field of tasks assigned to them

Members cannot:

- create users
- create tasks
- edit task title
- edit task description
- reassign tasks
- delete tasks
- access tasks from another organization

## Tenant Isolation Model

Tenant isolation is enforced in the backend, not in the client.

The system uses the authenticated user’s `organization_id` from the JWT-backed user record to scope access. The organization is never selected from the UI during login and is never trusted from request payloads for authorization.

Isolation rules:

- a user can only see data from their own organization
- task lookups always filter by `task.id` and `organization_id`
- cross-tenant access returns `404` or `403` depending on the access path
- assignees must belong to the same organization as the task creator/admin

## Project Structure

```text
OrgSync/
|-- api/
|   |-- scripts/
|   |   |-- init.sql
|   |   `-- seed.sql
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- db/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   |-- Dockerfile
|   `-- package.json
|-- web/
|   |-- src/
|   |   |-- components/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- styles.css
|   |-- Dockerfile
|   `-- package.json
|-- docker-compose.yaml
`-- README.md
```

## Getting Started

### Prerequisites

Install:

- Node.js 22+ recommended
- npm
- Docker Desktop or Docker Engine with Compose support

## Environment Variables

### Backend

Create an `.env` in `api/` if you want to override defaults.

Reference values from `api/.env.example`:

```env
PORT=4000
DATABASE_URL=postgres://postgres:postgres@db:5432/task_manager
JWT_SECRET=change-me
CLIENT_ORIGIN=http://localhost:5173
```

### Frontend

Reference values from `web/.env.example`:

```env
VITE_API_URL=http://localhost:4000
```

## Running with Docker

This is the easiest way to run the full system.

### Start the app

```bash
docker compose up --build
```

This starts:

- `db` on port `5432`
- `api` on port `4000`
- `web` on port `5173`

### Open the app

- Frontend: [http://localhost:5173](http://localhost:5173)
- API health endpoint: [http://localhost:4000/health](http://localhost:4000/health)

### Important note about database initialization

The PostgreSQL container runs:

- `api/scripts/init.sql`
- `api/scripts/seed.sql`

These scripts are executed on initial database creation. If you already have an old persisted Docker volume and want a clean seeded database, remove the volume and recreate containers:

```bash
docker compose down -v
docker compose up --build
```

## Running Locally Without Docker

### 1. Start PostgreSQL

Make sure PostgreSQL is running locally and create a database named:

```text
task_manager
```

### 2. Initialize the schema

Run the SQL files in this order:

```text
api/scripts/init.sql
api/scripts/seed.sql
```

### 3. Install backend dependencies

```bash
cd api
npm install
```

### 4. Install frontend dependencies

```bash
cd web
npm install
```

### 5. Start backend

```bash
cd api
npm run dev
```

### 6. Start frontend

```bash
cd web
npm run dev
```

Then open:

- frontend: [http://localhost:5173](http://localhost:5173)
- backend: [http://localhost:4000](http://localhost:4000)

## Seeded Demo Accounts

These accounts are inserted by `seed.sql`.

Password for all demo users:

```text
password123
```

### Organization 1: Acme Corp

- `alice@acme.test` -> admin
- `mark@acme.test` -> member

### Organization 2: Globex Inc

- `gina@globex.test` -> admin
- `mina@globex.test` -> member

Use these accounts to verify:

- tenant isolation across organizations
- admin vs member capabilities
- member assigned-task status updates

## API Reference

Base URL:

```text
http://localhost:4000
```

Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

### Auth Endpoints

#### `POST /auth/register`

Creates a new organization and its first admin user.

Request body:

```json
{
  "organizationName": "Acme Labs",
  "fullName": "Jane Admin",
  "email": "jane@acme.test",
  "password": "password123"
}
```

Response:

- JWT token
- authenticated user info
- organization info

#### `POST /auth/login`

Logs in an existing user.

Request body:

```json
{
  "email": "alice@acme.test",
  "password": "password123"
}
```

#### `GET /auth/me`

Returns the authenticated user and organization context.

### User Endpoints

These are admin-only.

#### `GET /users`

Returns all users in the current organization.

#### `POST /users`

Creates a new user inside the authenticated admin’s organization.

Request body:

```json
{
  "fullName": "Demo Member",
  "email": "demo-member@test.com",
  "password": "password123",
  "role": "member"
}
```

### Task Endpoints

#### `GET /tasks`

Returns:

- all organization tasks for admins
- only assigned tasks for members

#### `POST /tasks`

Admin-oriented task creation endpoint.

Request body:

```json
{
  "title": "Prepare launch checklist",
  "description": "Confirm deployment, analytics, and rollback plan",
  "status": "todo",
  "assignedTo": 2
}
```

#### `GET /tasks/:id`

Returns one task if it belongs to the authenticated user’s organization and the user is allowed to view it.

#### `PATCH /tasks/:id`

Admin behavior:

- can update title
- can update description
- can update status
- can update assignee

Member behavior:

- can update only `status`
- only for tasks assigned to them

Example member request:

```json
{
  "status": "done"
}
```

#### `DELETE /tasks/:id`

Admin-only task deletion flow.

#### `GET /tasks/:id/activity`

Returns task activity history for:

- admins in the same organization
- assigned members for the same task

## Frontend Behavior

### Authentication

- users can log in with email and password
- new organizations can be created from the registration form
- no organization selector is shown during login

### Admin UI

Admins see:

- organization dashboard
- task creation and edit form
- full task list for the organization
- edit and delete actions
- add demo member button

### Member UI

Members see:

- only tasks assigned to them
- a task detail view with a status dropdown
- disabled admin-style management actions
- toast feedback when status updates succeed or fail

### Toast Notifications

The frontend uses toast notifications for:

- login success/failure
- registration success/failure
- task creation success/failure
- task update success/failure
- task deletion success/failure
- demo member creation success/failure
- member status update success/failure

## Database Schema Summary

### `organizations`

- `id`
- `name`
- `created_at`

### `users`

- `id`
- `organization_id`
- `full_name`
- `email`
- `password_hash`
- `role`
- `created_at`

### `tasks`

- `id`
- `organization_id`
- `title`
- `description`
- `status`
- `created_by`
- `assigned_to`
- `deleted_at`
- `created_at`
- `updated_at`

### `task_activity_logs`

- `id`
- `task_id`
- `organization_id`
- `actor_user_id`
- `action`
- `details`
- `created_at`

## Activity Log Behavior

Activity is recorded for task mutations. The current system records entries for:

- task creation
- task updates
- task deletion

Each activity record includes:

- which task changed
- which organization it belongs to
- which user performed the action
- the action type
- structured JSON details
- timestamp

This makes it easier to audit how work changes over time inside a tenant.

## Security Notes

- passwords are hashed with `bcryptjs`
- JWT is required for protected routes
- organization membership is derived from authenticated user context
- frontend role checks improve UX, but backend enforcement is the real security boundary
- user creation enforces unique email addresses
- assignee validation ensures cross-tenant assignments are blocked

## Current Limitations

- no refresh-token flow
- no forgot-password or password reset flow
- no OAuth provider integration yet
- no automated test suite included yet
- no pagination/filtering beyond current UI behavior
- frontend session storage currently uses local storage for simplicity
- no invitation/email verification flow

## Future Improvements

- add OAuth login with Google or GitHub
- add refresh tokens and session rotation
- add automated backend and frontend tests
- add richer task filtering and search
- add due dates, priorities, and comments
- add organization invitations
- add audit trail filtering and export
- switch to HTTP-only cookie auth for stronger browser security

## Submission Summary

OrgSync satisfies the main problem requirements by implementing:

- multi-tenant organization isolation
- JWT authentication
- RBAC with admin and member roles
- task CRUD with tenant-aware authorization
- task activity history
- Dockerfiles and `docker-compose.yaml`

It also includes a usable frontend for demonstrating the full workflow instead of exposing only raw API endpoints.
