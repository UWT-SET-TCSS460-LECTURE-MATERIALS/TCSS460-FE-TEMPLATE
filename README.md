# TCSS 460 - Frontend Template

A Next.js 15 template with authentication, API integration, and a complete UI framework for building modern web applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Authentication System](#authentication-system)
- [HTTP & API Communication](#http--api-communication)
- [Key Technologies](#key-technologies)
- [Common Workflows](#common-workflows)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm installed
- Access to the backend APIs (Credentials API and Messages API)
- Your `.env` file (download from Canvas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TCSS460-FE-TEMPLATE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Download the `.env` file from Canvas
   - Place it in the **root** of your project (same level as `package.json`)
   - The `.env` file contains API URLs and keys - **never commit this file to git**

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You should see the login page

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts development server on port 3000 with hot-reload |
| `npm run build` | Creates an optimized production build |
| `npm start` | Runs the production build (run `build` first) |
| `npm run lint` | Checks code for style and potential errors |
| `npm run lint:fix` | Automatically fixes linting issues where possible |
| `npm run prettier` | Formats code according to project standards |

### Typical Development Flow

```bash
# Make changes to your code
npm run lint:fix    # Fix any style issues
npm run build       # Test that production build works
npm run dev         # Run development server to test changes
```

---

## Environment Configuration

Your `.env` file (provided via Canvas) contains critical configuration:

```bash
# Application Version
REACT_APP_VERSION=v3.3.0

# Messages API (your main backend API)
MESSAGES_WEB_API_URL=http://localhost:8000
MESSAGES_WEB_API_KEY=<your-api-key-here>

# Credentials API (handles authentication)
CREDENTIALS_API_URL=http://localhost:8008

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000/
NEXTAUTH_SECRET_KEY=<secret-key>

# JWT Configuration
REACT_APP_JWT_TIMEOUT=86400  # 1 day in seconds
REACT_APP_JWT_SECRET=<jwt-secret>
```

### Important Notes

- **The app WILL NOT start** if these environment variables are missing
- Each variable is validated at startup (see [src/utils/axios.ts](src/utils/axios.ts))
- The `.env` file is in `.gitignore` - it should never be committed to version control
- For production deployment, you'll configure these in your hosting platform (Vercel, AWS, etc.)

### What Each Variable Does

| Variable | Purpose |
|----------|---------|
| `MESSAGES_WEB_API_URL` | Base URL for your main application API |
| `MESSAGES_WEB_API_KEY` | API key required by the Messages API for authentication |
| `CREDENTIALS_API_URL` | Base URL for the authentication API (login/register) |
| `NEXTAUTH_URL` | URL where your frontend app is running |
| `NEXTAUTH_SECRET_KEY` | Secret key used to encrypt session tokens |
| `REACT_APP_JWT_TIMEOUT` | How long until user sessions expire (in seconds) |

---

## Project Structure

```
TCSS460-FE-TEMPLATE/
├── public/                 # Static assets (images, fonts, etc.)
│   └── assets/            # Project-specific images and icons
│
├── src/
│   ├── app/               # Next.js App Router (main routing)
│   │   ├── (auth)/        # Authentication pages (login, register, etc.)
│   │   ├── (dashboard)/   # Protected dashboard pages
│   │   ├── (simple)/      # Simple layout pages
│   │   ├── api/           # API routes (backend-like endpoints)
│   │   ├── layout.tsx     # Root layout wrapper
│   │   └── page.tsx       # Home page (redirects to dashboard)
│   │
│   ├── components/        # Reusable UI components
│   │   ├── @extended/     # Enhanced/customized components
│   │   ├── cards/         # Card components
│   │   ├── logo/          # Logo components
│   │   └── ...            # Other shared components
│   │
│   ├── contexts/          # React Context providers (global state)
│   │   ├── ConfigContext.tsx    # App configuration
│   │   └── MessageContext.tsx   # Message state management
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useUser.ts     # Get current user info
│   │   └── useLocalStorage.ts  # Persist data in browser
│   │
│   ├── layout/            # Layout components (header, sidebar, footer)
│   │   ├── DashboardLayout/     # Main dashboard layout
│   │   └── SimpleLayout/        # Minimal layout for auth pages
│   │
│   ├── sections/          # Page-specific components
│   │   ├── auth/          # Authentication forms
│   │   └── messages/      # Message-related forms
│   │
│   ├── services/          # API service layer
│   │   └── messagesApi.ts # Messages API functions
│   │
│   ├── themes/            # Material-UI theme configuration
│   │
│   ├── types/             # TypeScript type definitions
│   │
│   ├── utils/             # Utility functions and configurations
│   │   ├── axios.ts       # HTTP client setup (IMPORTANT!)
│   │   ├── authOptions.ts # NextAuth configuration
│   │   └── route-guard/   # Protected route wrappers
│   │
│   └── views/             # Complex page views
│       └── messages/      # Message views (list, send, etc.)
│
├── edu/                   # Educational documentation
│   └── authentication-explained.md  # Detailed auth guide
│
├── .env                   # Environment variables (from Canvas)
├── .gitignore            # Files to exclude from git
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

### Key Directories Explained

#### `src/app/` - The Heart of Your Application

Next.js 15 uses the **App Router** where folders define your URL routes:

- **`(auth)/`** - Route group for authentication pages
  - `login/` → `/login`
  - `register/` → `/register`
  - Parentheses `()` mean the folder name doesn't appear in the URL

- **`(dashboard)/`** - Route group for protected pages
  - `messages/send/` → `/messages/send`
  - `messages/list/` → `/messages/list`
  - `messages/msgContext/` → `/messages/msgContext` (demonstrates Context API)
  - `messages/msgParam/[slug]/` → `/messages/msgParam/:id` (dynamic routes)
  - `messages/msgQuery/` → `/messages/msgQuery` (demonstrates URL query params)

- **`api/`** - Backend API endpoints (serverless functions)
  - `api/auth/[...nextauth]/` → Handles all NextAuth requests
  - `api/auth/protected/` → Server-side session validation

Each route folder typically contains:
- `page.tsx` - The page component (required)
- `layout.tsx` - Layout wrapper (optional)
- `loading.tsx` - Loading state (optional)

#### `src/utils/axios.ts` - HTTP Client Configuration ⭐

This is one of the **most important files** in the project. It configures two separate HTTP clients:

1. **credentialsService** - For authentication API
2. **messagesService** - For your main application API

See [HTTP & API Communication](#http--api-communication) below for details.

#### `src/services/` - API Service Layer

Abstraction layer for API calls. Instead of calling axios directly in components, you use these services:

```typescript
// src/services/messagesApi.ts
import { messagesService } from 'utils/axios';

export const messagesApi = {
  getAllPaginated: (offset: number, limit: number) =>
    messagesService.get(`/protected/message/all/paginated?offset=${offset}&limit=${limit}`),

  create: (data) => messagesService.post('/protected/message', data),

  delete: (name: string) => messagesService.delete(`/protected/message/${name}`)
};
```

Then in your components:
```typescript
import { messagesApi } from 'services/messagesApi';

// Send a message
await messagesApi.create({ name: 'John', message: 'Hello!', priority: 1 });
```

---

## Authentication System

This app uses **NextAuth.js** (Auth.js) for authentication, which handles login, registration, sessions, and JWT tokens.

### Quick Overview

1. **Login/Register**: User submits credentials → Backend validates → Returns access token
2. **Session Management**: Access token stored in encrypted JWT cookie
3. **Protected Routes**: `AuthGuard` wraps pages requiring authentication
4. **API Requests**: Access token automatically added to requests via axios interceptor

### Key Files

| File | Purpose |
|------|---------|
| [src/utils/authOptions.ts](src/utils/authOptions.ts) | NextAuth configuration (providers, callbacks, session settings) |
| [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/[...nextauth]/route.ts) | NextAuth API handler |
| [src/sections/auth/auth-forms/AuthLogin.tsx](src/sections/auth/auth-forms/AuthLogin.tsx) | Login form component |
| [src/sections/auth/auth-forms/AuthRegister.tsx](src/sections/auth/auth-forms/AuthRegister.tsx) | Registration form |
| [src/utils/route-guard/AuthGuard.tsx](src/utils/route-guard/AuthGuard.tsx) | Component to protect routes |
| [src/hooks/useUser.ts](src/hooks/useUser.ts) | Hook to access current user data |

### Using Authentication in Your Code

**Get current user:**
```typescript
import useUser from 'hooks/useUser';

function MyComponent() {
  const user = useUser();

  if (!user) return <div>Not logged in</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

**Protect a page:**
```typescript
import AuthGuard from 'utils/route-guard/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <h1>Only logged-in users can see this</h1>
    </AuthGuard>
  );
}
```

**Logout:**
```typescript
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    signOut({ redirect: false });
    router.push('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Detailed Documentation

For a complete, in-depth explanation of how authentication works in this application, see:
**[edu/authentication-explained.md](edu/authentication-explained.md)**

That document covers:
- Step-by-step authentication flow
- How NextAuth providers work
- JWT callback and session callback details
- Backend API integration
- Axios interceptors for auth headers
- Protected routes implementation

---

## HTTP & API Communication

This application communicates with **two separate backend APIs**. Understanding how this works is crucial for your development.

### Two API Services

The app uses two configured axios instances (HTTP clients):

#### 1. credentialsService (Authentication API)

**Purpose**: Handles user authentication (login, register, password reset)

**Configuration**: [src/utils/axios.ts:34-66](src/utils/axios.ts#L34-L66)

```typescript
const credentialsService = axios.create({
  baseURL: process.env.CREDENTIALS_API_URL  // e.g., http://localhost:8008
});

// Automatically adds authorization header to requests
credentialsService.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.token.accessToken) {
    config.headers['Authorization'] = `Bearer ${session?.token.accessToken}`;
  }
  return config;
});
```

**Key Point**: After login, this service automatically includes your access token in the `Authorization` header.

#### 2. messagesService (Application API)

**Purpose**: Your main application API for sending/receiving messages

**Configuration**: [src/utils/axios.ts:70-97](src/utils/axios.ts#L70-L97)

```typescript
const messagesService = axios.create({
  baseURL: process.env.MESSAGES_WEB_API_URL  // e.g., http://localhost:8000
});

// Automatically adds API key header to requests
messagesService.interceptors.request.use(async (config) => {
  config.headers['X-API-Key'] = process.env.MESSAGES_WEB_API_KEY;
  return config;
});
```

**Key Point**: This service automatically includes your API key in the `X-API-Key` header for every request.

### How Axios Interceptors Work

Think of interceptors as middleware that runs before every request or after every response.

**Request Interceptor** (Runs BEFORE sending request to server):
```
Your Code → Request Interceptor → Add Headers → Send to Server
           (Add auth token/API key automatically!)
```

**Response Interceptor** (Runs AFTER receiving response from server):
```
Server Response → Response Interceptor → Handle Errors → Return to Your Code
                 (Redirect to login on 401, show error on 500)
```

### Real-World Example

Let's see how these work in practice:

**Sending a message** ([src/services/messagesApi.ts](src/services/messagesApi.ts)):

```typescript
import { messagesService } from 'utils/axios';

export const messagesApi = {
  create: (data) => messagesService.post('/protected/message', data)
};
```

When you call:
```typescript
await messagesApi.create({
  name: 'John',
  message: 'Hello!',
  priority: 1
});
```

What actually happens:
1. **Your code calls** `messagesService.post('/protected/message', data)`
2. **Request interceptor runs** and adds API key:
   ```
   Headers: {
     'X-API-Key': '8d407611-225a-4806-9ea8-f79ab0d3e5bc'
   }
   ```
3. **Full URL constructed**: `http://localhost:8000/protected/message`
4. **Request sent** with data and headers
5. **Server validates** API key and processes request
6. **Response interceptor runs** and handles any errors
7. **Data returned** to your code

### Error Handling

Both services have response interceptors that handle common errors:

| Status Code | What Happens |
|-------------|--------------|
| **401 Unauthorized** | Redirects to `/login` (your session expired) |
| **500+ Server Error** | Returns user-friendly error message |
| **ECONNREFUSED** | Connection failed (backend server is down) |

This is implemented in [src/utils/axios.ts:49-66](src/utils/axios.ts#L49-L66) and [src/utils/axios.ts:82-96](src/utils/axios.ts#L82-L96).

### Adding New API Calls

When you need to add a new API endpoint:

1. **Determine which service to use:**
   - Authentication-related? → Use `credentialsService`
   - Application-related? → Use `messagesService`

2. **Add to appropriate service file:**
   ```typescript
   // src/services/messagesApi.ts
   export const messagesApi = {
     // ... existing methods ...

     getMessageById: (id: string) =>
       messagesService.get(`/protected/message/${id}`)
   };
   ```

3. **Use in your component:**
   ```typescript
   import { messagesApi } from 'services/messagesApi';

   const message = await messagesApi.getMessageById('123');
   ```

That's it! The interceptors handle authentication automatically.

### Visual Summary

```
┌─────────────────────────────────────────────────────────┐
│                  Your React Component                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              services/messagesApi.ts                    │
│    (High-level API functions you call)                 │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│ credentialsService│      │ messagesService  │
│ (axios instance)  │      │ (axios instance) │
└────────┬──────────┘      └────────┬─────────┘
         │                          │
         ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│ Request          │      │ Request          │
│ Interceptor:     │      │ Interceptor:     │
│ Add Bearer token │      │ Add X-API-Key    │
└────────┬─────────┘      └────────┬─────────┘
         │                          │
         ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│ Credentials API  │      │ Messages API     │
│ localhost:8008   │      │ localhost:8000   │
└──────────────────┘      └──────────────────┘
```

---

## Key Technologies

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **Next.js 15** | React framework with server-side rendering | [nextjs.org](https://nextjs.org) |
| **React 18** | UI library | [react.dev](https://react.dev) |
| **TypeScript** | Type-safe JavaScript | [typescriptlang.org](https://www.typescriptlang.org) |
| **NextAuth.js** | Authentication library | [next-auth.js.org](https://next-auth.js.org) |
| **Material-UI (MUI) v6** | Component library (buttons, forms, layouts) | [mui.com](https://mui.com) |
| **Axios** | HTTP client for API requests | [axios-http.com](https://axios-http.com) |
| **Formik** | Form management (validation, submission) | [formik.org](https://formik.org) |
| **Yup** | Schema validation for forms | [github.com/jquense/yup](https://github.com/jquense/yup) |
| **SWR** | Data fetching and caching | [swr.vercel.app](https://swr.vercel.app) |

---

## Common Workflows

### Creating a New Page

1. **Create a folder in `src/app/(dashboard)/`**
   ```bash
   mkdir src/app/(dashboard)/my-new-page
   ```

2. **Add a `page.tsx` file**
   ```typescript
   // src/app/(dashboard)/my-new-page/page.tsx
   import MyNewPageView from 'views/my-new-page';

   export default function MyNewPage() {
     return <MyNewPageView />;
   }
   ```

3. **Create the view component**
   ```typescript
   // src/views/my-new-page.tsx
   'use client';

   export default function MyNewPageView() {
     return (
       <div>
         <h1>My New Page</h1>
       </div>
     );
   }
   ```

4. **Add to menu** (optional)
   - Edit [src/menu-items/dashboard.tsx](src/menu-items/dashboard.tsx)

### Making an API Call

```typescript
'use client';
import { useState, useEffect } from 'react';
import { messagesService } from 'utils/axios';

export default function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await messagesService.get('/protected/message/all');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <div>{JSON.stringify(data)}</div>;
}
```

### Adding a Form

```typescript
'use client';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { messagesService } from 'utils/axios';

export default function MyForm() {
  return (
    <Formik
      initialValues={{ name: '', message: '' }}
      validationSchema={Yup.object({
        name: Yup.string().required('Name is required'),
        message: Yup.string().required('Message is required')
      })}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          await messagesService.post('/protected/message', values);
          resetForm();
          alert('Success!');
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, handleChange, handleSubmit, isSubmitting }) => (
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="Name"
          />
          {errors.name && <div>{errors.name}</div>}

          <input
            name="message"
            value={values.message}
            onChange={handleChange}
            placeholder="Message"
          />
          {errors.message && <div>{errors.message}</div>}

          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </form>
      )}
    </Formik>
  );
}
```

---

## Troubleshooting

### App won't start - "CREDENTIALS_API_URL environment variable is not set"

**Solution**: Make sure your `.env` file is in the project root and contains all required variables. Download it from Canvas if missing.

### "Connection refused" errors

**Solution**: Make sure both backend APIs are running:
- Credentials API should be running on `localhost:8008`
- Messages API should be running on `localhost:8000`

### Redirected to login page unexpectedly

**Solution**: Your session expired. This happens after 1 day (86400 seconds) by default. Log in again.

### TypeScript errors

**Solution**: Run `npm run lint:fix` to auto-fix style issues. For type errors, make sure your types match:
```typescript
// Check src/types/ for type definitions
import { IMessage } from 'types/message';
```

### Build fails

**Solution**:
1. Run `npm run lint` to check for errors
2. Fix any TypeScript or ESLint errors
3. Make sure all imports are correct
4. Try deleting `.next` folder and rebuilding:
   ```bash
   rm -rf .next
   npm run build
   ```

---

## Additional Resources

- **Detailed Authentication Guide**: [edu/authentication-explained.md](edu/authentication-explained.md)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Material-UI Components**: [mui.com/components](https://mui.com/material-ui/all-components/)
- **NextAuth.js Guide**: [next-auth.js.org/getting-started/introduction](https://next-auth.js.org/getting-started/introduction)

---

## Questions?

If you run into issues:
1. Check the error message carefully
2. Review the relevant section in this README
3. Check [edu/authentication-explained.md](edu/authentication-explained.md) for auth issues
4. Post on Canvas discussion board
5. Attend office hours

Happy coding!
