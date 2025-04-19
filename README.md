# Design Project Management System

A web application developed with Next.js 15, Tailwind CSS, Prisma, and Supabase that allows different types of users (Clients, Project Managers, and Designers) to manage design projects securely, intuitively, and functionally.

## Main Features

- **Role-based authentication and authorization**
- **Complete project management** (create, read, update, delete)
- **File upload and management** with Supabase Storage
- **Responsive and modern interface** with Tailwind CSS and ShadCN UI
- **Project assignment** to designers

## Technologies Used

- **Frontend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **State and Cache Management**: React Query
- **Form Validation**: Zod + React Hook Form

## Local Setup Instructions

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- [Supabase](https://supabase.com/) account

### Step 1: Clone the repository

```bash
git clone https://github.com/reiorozco/project-manager-app.git
cd project-manager-app
```

### Step 2: Install dependencies

```bash
npm install
# or if you use yarn
yarn install
```

### Step 3: Configure Supabase

1. Create a new project in Supabase

2. Configure authentication:
    - In "Authentication" > "Providers", enable "Email"
    - In "URL Configuration", set Site URL as `http://localhost:3000`
    - Add `http://localhost:3000/auth/callback` as a redirect URL

3. Create a bucket for files:
    - In "Storage", create a new bucket called `project-files`
    - Set appropriate RLS permissions or make it public for testing

### Step 4: Configure environment variables

Create a `.env.local` file in the project root with the following content:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DIRECT_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
```

### Step 5: Configure Prisma and synchronize the schema

```bash
npx prisma db push
```

### Step 6: Run the development server

```bash
npm run dev
# or with yarn
yarn dev
```

Now you can access the application at [http://localhost:3000](http://localhost:3000/).

## Technical Explanation of the Solution

### General Architecture

The project is built following the Next.js App Router architecture, which allows the combination of server-side and client-side components. The application follows an API-first approach, where client components communicate with API endpoints to perform CRUD operations.

### Authentication and Authorization

- **Authentication**: Implemented using Supabase Auth, which provides a complete system for registration, login, and session management.

- **Authentication flow**:
    1. The user registers or logs in through forms built with React Hook Form and validated with Zod
    2. Supabase handles authentication and returns a JWT token
    3. The token is stored in cookies using the Supabase client for Next.js
    4. A middleware verifies authentication on protected routes

- **Role-based authorization**:
    - Three roles were defined: Client, Project Manager, and Designer
    - Each role has different permissions and access to functionalities
    - Authorization is verified both in the frontend and backend
    - Project Managers can manage all projects
    - Clients can only manage their own projects
    - Designers can only view projects assigned to them

### Project Management (CRUD)

![DBML Schema](https://github.com/reiorozco/project-manager-app/blob/master/public/schema.svg)

A complete project management system was implemented with the following functionalities:

- **Create**: Form to create projects with title, description, and files
- **Read**: List view and detailed view of projects
- **Update**: Project editing, including assignment to designers
- **Delete**: Project deletion with confirmation

Each operation is protected by authorization checks to ensure that only users with appropriate permissions can make changes.

### State and Cache Management with React Query

React Query was used to efficiently manage server state:
- Smart caching to reduce unnecessary requests
- Automatic cache invalidation when data changes
- Retry of failed requests
- Loading and error states to improve UX
- Optimistic mutations for instant updates

### File Management

- File uploads are handled through Supabase Storage
- Multiple file uploads are supported
- File size and type validation is implemented
- Unique names are generated to avoid collisions
- Files are organized in folders by user and project

### User Interface

The interface was built with Tailwind CSS and ShadCN UI components to create a modern and coherent experience:

- Responsive design that works on mobile and desktop devices
- Intuitive forms with real-time validation
- Visual feedback for asynchronous operations
- Confirmation modals for destructive actions
- Clear and consistent navigation

### Security

Several security layers were implemented:

- Authentication with JWT tokens
- Authorization verification at each API endpoint
- Input validation on client and server
- Row Level Security (RLS) policies in Supabase
- Data sanitization before storage

## Project Structure

```
├── app/                     # Application structure (App Router)
│   ├── api/                 # API endpoints
│   ├── auth/                # Authentication pages
│       └── auth-context.tsx # Authentication context
│   ├── components/          # Reusable components
│       └── dashboard/       # UI Components (ShadCN)
│       └── form/            # UI Components (ShadCN)
│       └── projects/        # UI Components (ShadCN)
│   ├── projects/            # Project management
│   └── page.tsx             # Home page
├── components/              # Reusable components
│   └── ui/                  # UI Components (ShadCN)
├── generated/               # Prisma generated
├── lib/                     # Utilities and services
│   ├── services/            # Application services
│   ├── supabase/            # Supabase client
│   └── prisma.ts            # Prisma client
├── prisma/                  # Prisma configuration
│   └── schema.prisma        # Database schema
├── public/                  # Static files
├── .env.local               # Environment variables (not included in repo)
├── middleware.ts            # Authentication middleware
├── next.config.js           # Next.js configuration
└── package.json             # Project dependencies
```

## Potential Future Improvements

- Implementation of real-time notifications
- Project comment system
- Analytics dashboard for Project Managers
- Filtering, sorting, and pagination for projects page
- Implementation of automated tests
