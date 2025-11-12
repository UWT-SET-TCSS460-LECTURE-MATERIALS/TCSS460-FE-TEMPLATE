# Authentication System Documentation

**Audience:** TCSS 460 Students (400-level Web Development)

This document explains how authentication works in this Next.js application. By the end, you'll understand how users log in, how their identity is managed across requests, and how different backend services are configured.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Environment Configuration](#environment-configuration)
3. [HTTP Services Architecture](#http-services-architecture)
4. [NextAuth Configuration](#nextauth-configuration)
5. [Login & Registration Flow](#login--registration-flow)
6. [Route Protection](#route-protection)
7. [Making Authenticated API Calls](#making-authenticated-api-calls)
8. [Complete Authentication Flow](#complete-authentication-flow)

---

## System Overview

This application uses **NextAuth.js** (also called Auth.js), a popular authentication library designed specifically for Next.js applications. Instead of building login systems from scratch (which is complex and security-sensitive), NextAuth provides:

- Pre-built authentication flows
- Secure session management with JWTs
- Flexible provider system
- Built-in CSRF protection
- TypeScript support

**Key Architectural Decision:** This app uses a **stateless JWT-based authentication** strategy. Your browser stores an encrypted JWT token (like a secure digital ID card) that proves your identity. The server doesn't need to remember your session—it just validates the token on each request.

**Important:** This system connects to **two separate backend APIs**:
1. **Credentials API** - Handles user authentication (login/register)
2. **Messages API** - Handles application data (messages, business logic)

Each service has its own authentication strategy, which we'll explore in detail.

---

## Environment Configuration

### Required Environment Variables

Before the app can run, you **must** configure these environment variables in your `.env` file at the project root:

```bash
# Credentials API - Handles authentication
CREDENTIALS_API_URL=http://localhost:8008

# Messages API - Handles application data
MESSAGES_WEB_API_URL=http://localhost:8000
MESSAGES_WEB_API_KEY=your-api-key-here

# JWT Configuration
NEXT_APP_JWT_TIMEOUT=86400        # Session timeout in seconds (24 hours)
NEXT_APP_JWT_SECRET=your-secret   # Secret key for signing JWTs

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### Why These Variables Matter

**Environment variables** let you change configuration without modifying code. The same codebase can run in:
- **Development:** `CREDENTIALS_API_URL=http://localhost:8008`
- **Production:** `CREDENTIALS_API_URL=https://api.yourcompany.com`

### Validation at Startup

**Where:** [src/utils/axios.ts:8-30](src/utils/axios.ts#L8-L30)

The app validates all required environment variables when it starts:

```typescript
if (!process.env.CREDENTIALS_API_URL) {
  throw new Error(
    'CREDENTIALS_API_URL environment variable is not set. ' +
    'Please add CREDENTIALS_API_URL to your .env and/or next.config.js file(s). ' +
    'Example: CREDENTIALS_API_URL=http://localhost:8008'
  );
}

if (!process.env.MESSAGES_WEB_API_URL) {
  throw new Error(
    'MESSAGES_WEB_API_URL environment variable is not set. ' +
    'Please add MESSAGES_WEB_API_URL to your .env and/or next.config.js file(s). ' +
    'Example: MESSAGES_WEB_API_URL=http://localhost:8000'
  );
}

if (!process.env.MESSAGES_WEB_API_KEY) {
  throw new Error(
    'MESSAGE_WEB_API_KEY environment variable is not set. ' +
    'Please add MESSAGE_WEB_API_KEY to your .env and/or next.config.js file(s). ' +
    'Example: MESSAGE_WEB_API_KEY=your-api-key-here'
  );
}
```

**Why fail fast?** If a required setting is missing, it's better to crash immediately with a clear error message than to fail mysteriously during runtime. This follows the **"fail fast"** principle—catch configuration errors early.

---

## HTTP Services Architecture

### Dual-Service Pattern

This application uses **two separate HTTP services** with different authentication strategies. Understanding why requires understanding the backend architecture.

**Where:** [src/utils/axios.ts:34-102](src/utils/axios.ts#L34-L102)

### Service 1: Credentials Service (Authentication)

**Purpose:** Handles user authentication (login, register)

**Configuration:**
```typescript
const credentialsService = axios.create({
  baseURL: process.env.CREDENTIALS_API_URL
});
```

**Authentication Strategy:** Bearer Token

When a user logs in, the backend returns an `accessToken`. This token is stored in the NextAuth session and automatically attached to every request:

```typescript
credentialsService.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.token.accessToken) {
      config.headers['Authorization'] = `Bearer ${session?.token.accessToken}`;
    }
    return config;
  }
);
```

**What's an interceptor?** Think of it like airport security. Before any HTTP request "flies out" to the server, the interceptor checks if we have a valid session and automatically adds the authentication header. You never have to manually add auth headers—it happens automatically for every request.

**Error Handling:** [src/utils/axios.ts:49-66](src/utils/axios.ts#L49-L66)

```typescript
credentialsService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. The Auth/Web API server may be down.');
      return Promise.reject({ message: 'Connection refused.' });
    } else if (error.response?.status >= 500) {
      return Promise.reject({ message: 'Server Error. Contact support' });
    } else if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Unauthorized - redirect to login
      window.location.pathname = '/login';
    }
    return Promise.reject((error.response && error.response.data) || 'Server connection refused');
  }
);
```

**Key behavior:** If the server returns `401 Unauthorized` (your token is invalid or expired), the app automatically redirects you to the login page.

---

### Service 2: Messages Service (Application Data)

**Purpose:** Handles application data and business logic

**Configuration:**
```typescript
const messagesService = axios.create({
  baseURL: process.env.MESSAGES_WEB_API_URL
});
```

**Authentication Strategy:** API Key

This service uses a **fixed API key** instead of per-user tokens:

```typescript
messagesService.interceptors.request.use(
  async (config) => {
    config.headers['X-API-Key'] = process.env.MESSAGES_WEB_API_KEY;
    return config;
  }
);
```

**Why a different authentication strategy?**

This is a common pattern when dealing with microservices:
- **Credentials Service:** Needs to know **who** you are (per-user authentication)
- **Messages Service:** Verifies the request is from a **trusted client** (app-level authentication)

The Messages API likely does its own authorization checking based on data in the request, while the API key simply proves the request came from an authorized application.

**Error Handling:** [src/utils/axios.ts:82-97](src/utils/axios.ts#L82-L97)

Similar to the credentials service but **doesn't redirect to login** on 401 errors, since authentication failures here are typically configuration problems rather than expired user sessions.

---

### API Service Wrappers

To make API calls cleaner, there are dedicated service files that use these axios instances:

#### Authentication Service

**Where:** [src/services/authApi.ts:1-8](src/services/authApi.ts#L1-L8)

```typescript
import { credentialsService } from 'utils/axios';

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    credentialsService.post('/auth/login', credentials),

  register: (data: { email: string; password: string; firstname: string; lastname: string; username: string; phone: string }) =>
    credentialsService.post('/auth/register', data)
};
```

**Usage in code:**
```typescript
const response = await authApi.login({ email: 'user@example.com', password: 'pass123' });
```

**Result:** Sends a POST request to `http://localhost:8008/auth/login` (the baseURL + endpoint)

---

#### Messages Service

**Where:** [src/services/messagesApi.ts:1-10](src/services/messagesApi.ts#L1-L10)

```typescript
import { messagesService } from 'utils/axios';

export const messagesApi = {
  getAllPaginated: (offset: number, limit: number) =>
    messagesService.get(`/protected/message/all/paginated?offset=${offset}&limit=${limit}`),

  create: (data: { name: string; message: string; priority: number }) =>
    messagesService.post('/protected/message', data),

  delete: (name: string) =>
    messagesService.delete(`/protected/message/${name}`)
};
```

**Usage in code:**
```typescript
const response = await messagesApi.getAllPaginated(0, 20);
```

**Result:** Sends a GET request to `http://localhost:8000/protected/message/all/paginated?offset=0&limit=20` with the `X-API-Key` header automatically attached.

---

### Helper Functions for Data Fetching

**Where:** [src/utils/axios.ts:104-132](src/utils/axios.ts#L104-L132)

These helpers are designed to work with **SWR** (a React data-fetching library):

```typescript
// For credentialsService
export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await credentialsService.get(url, { ...config });
  return res.data;
};

export const fetcherPost = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await credentialsService.post(url, { ...config });
  return res.data;
};

// For messagesService
export const messagesFetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await messagesService.get(url, { ...config });
  return res.data;
};

export const messagesFetcherPost = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await messagesService.post(url, { ...config });
  return res.data;
};
```

**SWR Example:**
```typescript
import useSWR from 'swr';
import { fetcher } from 'utils/axios';

function MyComponent() {
  const { data, error } = useSWR('/api/user/profile', fetcher);
  // SWR automatically calls fetcher('/api/user/profile')
}
```

---

## NextAuth Configuration

NextAuth is configured in a central `authOptions` object that defines how authentication works.

**Where:** [src/utils/authOptions.ts:21-118](src/utils/authOptions.ts#L21-L118)

```typescript
export const authOptions: NextAuthOptions = {
  providers: [...],      // How users can authenticate
  callbacks: {...},      // Customize JWT and session data
  session: {...},        // Session configuration
  pages: {...}           // Custom auth page URLs
}
```

### 1. Providers

NextAuth uses **providers** to handle different authentication methods. This app uses **CredentialsProvider** for custom email/password authentication.

#### Login Provider

**Where:** [src/utils/authOptions.ts:23-51](src/utils/authOptions.ts#L23-L51)

```typescript
CredentialsProvider({
  id: 'login',
  name: 'login',
  credentials: {
    email: { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter Email' },
    password: { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password' }
  },
  async authorize(credentials) {
    try {
      const response = await authApi.login({
        email: credentials?.email!,
        password: credentials?.password!
      });

      if (response) {
        const data = response.data.data;
        data.user['accessToken'] = data.accessToken;
        return data.user;
      }
    } catch (e: any) {
      const errorMessage = e?.message || e?.response?.data?.message || 'Something went wrong!';
      throw new Error(errorMessage);
    }
  }
})
```

**How it works:**

1. When `signIn('login', credentials)` is called from the frontend, NextAuth invokes this provider's `authorize` function
2. The function calls your backend API via `authApi.login()`
3. The backend validates the credentials and returns a user object + access token
4. **Important:** The response structure is nested: `response.data.data` (not just `response.data`)
   - This is specific to how the backend API structures responses
5. The access token is attached to the user object: `data.user['accessToken'] = data.accessToken`
6. The user object is returned, which NextAuth uses to create a session
7. If anything fails, an error is thrown which shows as an error message in the login form

---

#### Register Provider

**Where:** [src/utils/authOptions.ts:52-86](src/utils/authOptions.ts#L52-L86)

```typescript
CredentialsProvider({
  id: 'register',
  name: 'register',
  credentials: {
    firstname: { name: 'firstname', label: 'First Name', type: 'text' },
    lastname: { name: 'lastname', label: 'Last Name', type: 'text' },
    email: { name: 'email', label: 'Email', type: 'email' },
    company: { name: 'company', label: 'Company', type: 'text' },
    password: { name: 'password', label: 'Password', type: 'password' }
  },
  async authorize(credentials) {
    try {
      const response = await authApi.register({
        firstname: credentials?.firstname!,
        lastname: credentials?.lastname!,
        password: credentials?.password!,
        email: credentials?.email!,
        username: credentials?.email!,
        phone: getRandomPhoneNumber()  // TODO: request from user
      });

      if (response) {
        const data = response.data.data;
        data.user['accessToken'] = data.accessToken;
        return data.user;
      }
    } catch (e: any) {
      const errorMessage = e?.message || e?.response?.data?.message || 'Something went wrong!';
      throw new Error(errorMessage);
    }
  }
})
```

**Note:** Registration uses `signIn('register', credentials)` - it creates the account **and** logs the user in all at once. This is why registration also uses NextAuth's `signIn()` function rather than a separate registration endpoint.

---

### 2. Callbacks

Callbacks let you customize how NextAuth handles JWTs and sessions.

#### JWT Callback

**Where:** [src/utils/authOptions.ts:89-96](src/utils/authOptions.ts#L89-L96)

```typescript
jwt: async ({ token, user, account }) => {
  if (user) {
    token.accessToken = user.accessToken;
    token.id = user.id;
    token.provider = account?.provider;
  }
  return token;
}
```

**When does this run?**
- When a JWT is created (right after successful login/register)
- When a JWT is updated (on certain NextAuth operations)

**What does it do?**
Takes data from the `user` object (returned by `authorize()`) and stores it in the JWT payload. The JWT is what gets stored in an encrypted cookie in the user's browser.

**Why store the accessToken?**
The JWT itself is just NextAuth's session token. But we also need the backend's `accessToken` to make authenticated requests to the Credentials API. By storing it in the JWT, we can access it on every request.

---

#### Session Callback

**Where:** [src/utils/authOptions.ts:98-105](src/utils/authOptions.ts#L98-L105)

```typescript
session: ({ session, token }) => {
  if (token) {
    session.id = token.id;
    session.provider = token.provider;
    session.token = token;
  }
  return session;
}
```

**When does this run?**
Whenever the client calls `getSession()` or `useSession()` to access session data.

**What does it do?**
Takes data from the JWT token and adds it to the session object that's exposed to React components. This is what you get when you call `useSession()` in your components.

**Flow:**
```
Login → authorize() returns user
      → JWT callback stores user data in JWT
      → JWT stored in encrypted cookie
      → User visits page
      → useSession() reads JWT
      → Session callback transforms JWT data into session object
      → Component receives session
```

---

### 3. Session Configuration

**Where:** [src/utils/authOptions.ts:107-113](src/utils/authOptions.ts#L107-L113)

```typescript
session: {
  strategy: 'jwt',
  maxAge: Number(process.env.NEXT_APP_JWT_TIMEOUT!)
},
jwt: {
  secret: process.env.NEXT_APP_JWT_SECRET
}
```

**strategy: 'jwt'** - Use stateless JWT-based sessions instead of database sessions
- **Pros:** Scalable, no database lookups, works in serverless environments
- **Cons:** Can't invalidate tokens server-side (they're valid until expiry)

**maxAge** - How long the session lasts (in seconds)
- Example: `86400` = 24 hours
- After this time, users must log in again

**secret** - Used to sign and encrypt the JWT
- **Critical security setting:** Keep this secret and unique per environment
- If someone gets this secret, they can forge valid sessions

---

### 4. Custom Pages

**Where:** [src/utils/authOptions.ts:114-117](src/utils/authOptions.ts#L114-L117)

```typescript
pages: {
  signIn: '/login',
  newUser: '/register'
}
```

By default, NextAuth provides its own login UI. These settings tell NextAuth to use your custom pages instead.

---

### 5. NextAuth API Route

NextAuth needs a catch-all API route to handle authentication requests.

**Where:** [src/app/api/auth/[...nextauth]/route.ts:1-6](src/app/api/auth/[...nextauth]/route.ts#L1-L6)

```typescript
import { authOptions } from 'utils/authOptions';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**What's `[...nextauth]`?**

This is Next.js catch-all route syntax. It matches:
- `/api/auth/signin`
- `/api/auth/signout`
- `/api/auth/session`
- `/api/auth/callback/login`
- `/api/auth/callback/register`
- Any other `/api/auth/*` route

NextAuth uses this single route to handle all authentication operations.

---

## Login & Registration Flow

### Login Form

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:61-204](src/sections/auth/auth-forms/AuthLogin.tsx#L61-L204)

The login form uses **Formik** for form management and **Yup** for validation.

#### Validation Schema

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:67-73](src/sections/auth/auth-forms/AuthLogin.tsx#L67-L73)

```typescript
validationSchema={Yup.object().shape({
  email: Yup.string()
    .email('Must be a valid email')
    .max(255)
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .test('no-leading-trailing-whitespace',
          'Password cannot start or end with spaces',
          (value) => value === value.trim())
    .min(6, 'Password must be at least 6 characters')
})}
```

**Custom validation:** The password validation includes a custom test to ensure passwords don't start or end with spaces. This prevents user errors where they accidentally copy/paste passwords with extra whitespace.

---

#### Form Submission

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:74-96](src/sections/auth/auth-forms/AuthLogin.tsx#L74-L96)

```typescript
onSubmit={(values, { setErrors, setSubmitting }) => {
  const trimmedEmail = values.email.trim();
  signIn('login', {
    redirect: false,
    email: trimmedEmail,
    password: values.password,
    callbackUrl: APP_DEFAULT_PATH
  }).then(
    (res: any) => {
      if (res?.error) {
        setErrors({ submit: res.error });
        setSubmitting(false);
      } else {
        preload('api/menu/dashboard', fetcher);
        setSubmitting(false);
      }
    }
  );
}}
```

**Step by step:**

1. **Trim the email** - Remove leading/trailing whitespace (common user error)
2. **Call `signIn('login', ...)`** - This is NextAuth's client-side login function
   - `id: 'login'` - References the login provider in authOptions
   - `redirect: false` - Don't automatically redirect; handle it programmatically
   - Credentials are passed as options
3. **Handle response:**
   - If error: Display error message in the form
   - If success: Preload the dashboard menu data for faster navigation
4. **Preloading** - `preload('api/menu/dashboard', fetcher)` uses SWR to fetch data before the user navigates, making the app feel faster

**Where does the actual HTTP request happen?**
When you call `signIn('login', ...)`:
1. NextAuth sends a POST request to `/api/auth/callback/login`
2. That route invokes the login provider's `authorize()` function
3. `authorize()` calls `authApi.login()` which sends the request to `{CREDENTIALS_API_URL}/auth/login`
4. Backend validates credentials and returns user + token
5. NextAuth creates a JWT with that data
6. JWT is stored in an encrypted HTTP-only cookie
7. `signIn()` promise resolves with success or error

---

### Registration Form

**Where:** [src/sections/auth/auth-forms/AuthRegister.tsx:80-96](src/sections/auth/auth-forms/AuthRegister.tsx#L80-L96)

Similar to login, but calls `signIn('register', ...)` and includes additional fields:

```typescript
signIn('register', {
  redirect: false,
  firstname: values.firstname,
  lastname: values.lastname,
  email: trimmedEmail,
  password: values.password,
  callbackUrl: APP_DEFAULT_PATH
})
```

**Why use `signIn()` for registration?**

This might seem counterintuitive, but remember: the register provider's `authorize()` function both creates the account **and** returns a user object. So registration logs you in immediately. You don't need to register, then navigate to login—it's one step.

---

## Route Protection

This app uses **guard components** to protect routes based on authentication status.

### AuthGuard (Protect Authenticated Routes)

**Where:** [src/utils/route-guard/AuthGuard.tsx:17-37](src/utils/route-guard/AuthGuard.tsx#L17-L37)

```typescript
export default function AuthGuard({ children }: GuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/auth/protected');
      const json = await res?.json();
      if (!json?.protected) {
        router.push('/login');
      }
    };
    fetchData();
  }, [session]);

  if (status === 'loading' || !session?.user) return <Loader />;

  return children;
}
```

**How it works:**

1. **Client-side check:** `useSession()` checks if there's a valid session
2. **Server-side verification:** Calls `/api/auth/protected` to double-check on the server
3. **If not authenticated:** Redirect to `/login`
4. **While loading:** Show a loading spinner
5. **If authenticated:** Render the protected content (`children`)

**Why both client and server checks?**

- **Client-side** (useSession): Fast, immediate feedback, good UX
- **Server-side** (/api/auth/protected): Authoritative, can't be bypassed, security

This is called **defense in depth** - multiple layers of security.

---

#### Protected API Endpoint

**Where:** [src/app/api/auth/protected/route.ts:1-12](src/app/api/auth/protected/route.ts)

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from 'utils/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session) {
    return NextResponse.json({ protected: true });
  } else {
    return NextResponse.json({ protected: false });
  }
}
```

This endpoint is called by AuthGuard to verify authentication server-side. `getServerSession()` is NextAuth's server-side function to check if there's a valid session.

---

### GuestGuard (Prevent Authenticated Users from Auth Pages)

**Where:** [src/utils/route-guard/GuestGuard.tsx:18-39](src/utils/route-guard/GuestGuard.tsx#L18-L39)

```typescript
export default function GuestGuard({ children }: GuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/auth/protected');
      const json = await res?.json();
      if (json?.protected) {
        let redirectPath = APP_DEFAULT_PATH;
        router.push(redirectPath);
      }
    };
    fetchData();
  }, [session]);

  if (status === 'loading' || session?.user) return <Loader />;

  return children;
}
```

**How it works:**

This is the **opposite** of AuthGuard. It prevents authenticated users from accessing login/register pages.

**Use case:** If you're already logged in and try to visit `/login`, this guard redirects you to the dashboard. This prevents confusion and improves UX.

**Where it's used:** [src/app/(auth)/layout.tsx](src/app/(auth)/layout.tsx) - Wraps all authentication pages (login, register, forgot password)

---

## Making Authenticated API Calls

Once logged in, all API requests automatically include authentication.

### Using the Credentials Service

**Example:** Getting user profile

```typescript
import { credentialsService } from 'utils/axios';

async function getUserProfile() {
  const response = await credentialsService.get('/api/user/profile');
  return response.data;
}
```

**What happens under the hood:**

1. Your code calls `credentialsService.get('/api/user/profile')`
2. Request interceptor runs → gets current session → adds `Authorization: Bearer <token>` header
3. Request sent to `http://localhost:8008/api/user/profile` with auth header
4. Backend validates the token and returns the data
5. If token is invalid (401 error), response interceptor redirects to `/login`

**You never have to manually add authentication headers!**

---

### Using the Messages Service

**Example:** Getting paginated messages

```typescript
import { messagesApi } from 'services/messagesApi';

async function getMessages(page = 0, pageSize = 20) {
  const offset = page * pageSize;
  const response = await messagesApi.getAllPaginated(offset, pageSize);
  return response.data;
}
```

**What happens under the hood:**

1. Your code calls `messagesApi.getAllPaginated(0, 20)`
2. This calls `messagesService.get('/protected/message/all/paginated?offset=0&limit=20')`
3. Request interceptor runs → adds `X-API-Key: <your-api-key>` header
4. Request sent to `http://localhost:8000/protected/message/all/paginated?offset=0&limit=20`
5. Backend validates the API key and returns messages

**Key difference:** The Messages API uses an API key (app-level authentication) rather than per-user Bearer tokens.

---

### Using SWR for Data Fetching

**SWR** is a React hook library for data fetching with caching, revalidation, and error handling built-in.

```typescript
import useSWR from 'swr';
import { fetcher } from 'utils/axios';

function UserProfile() {
  const { data, error, isLoading } = useSWR('/api/user/profile', fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>Welcome, {data.name}!</div>;
}
```

**What SWR provides:**

- **Automatic caching** - Don't refetch data that's already loaded
- **Revalidation** - Refetch in the background to keep data fresh
- **Error handling** - Automatic retry on failure
- **Focus revalidation** - Refetch when user returns to the tab
- **Network status** - Loading states handled for you

The `fetcher` function is what SWR uses to actually make the request. It's just a wrapper around `credentialsService.get()`.

---

## Complete Authentication Flow

### First-Time User Registration

```
1. User navigates to /register
   ↓
2. GuestGuard checks: not logged in → allow access
   ↓
3. User fills out registration form (firstname, lastname, email, password)
   ↓
4. Form validated with Yup
   ↓
5. Form submission calls: signIn('register', { credentials... })
   ↓
6. NextAuth POSTs to /api/auth/callback/register
   ↓
7. Register provider's authorize() runs
   ↓
8. authApi.register() sends POST to {CREDENTIALS_API_URL}/auth/register
   ↓
9. Backend creates account, returns { data: { user, accessToken } }
   ↓
10. authorize() extracts response.data.data and returns user object
    ↓
11. JWT callback stores accessToken in JWT
    ↓
12. JWT stored in encrypted HTTP-only cookie
    ↓
13. signIn() resolves successfully
    ↓
14. User now logged in, redirect to dashboard
```

---

### Returning User Login

```
1. User navigates to /login
   ↓
2. GuestGuard checks: not logged in → allow access
   ↓
3. User enters email and password
   ↓
4. Form validated with Yup
   ↓
5. Form submission calls: signIn('login', { email, password })
   ↓
6. NextAuth POSTs to /api/auth/callback/login
   ↓
7. Login provider's authorize() runs
   ↓
8. authApi.login() sends POST to {CREDENTIALS_API_URL}/auth/login
   ↓
9. Backend validates credentials, returns { data: { user, accessToken } }
   ↓
10. authorize() extracts response.data.data and returns user object
    ↓
11. JWT callback stores accessToken in JWT
    ↓
12. JWT stored in encrypted HTTP-only cookie
    ↓
13. signIn() resolves successfully
    ↓
14. Dashboard data preloaded with SWR
    ↓
15. User now logged in, redirect to dashboard
```

---

### Accessing Protected Route

```
1. Logged-in user navigates to /dashboard
   ↓
2. AuthGuard wraps the page
   ↓
3. useSession() reads JWT from cookie → session exists
   ↓
4. AuthGuard calls /api/auth/protected to verify server-side
   ↓
5. getServerSession() validates JWT → returns session
   ↓
6. /api/auth/protected returns { protected: true }
   ↓
7. AuthGuard allows access → renders page content
```

---

### Making Authenticated API Request

```
1. Component calls credentialsService.get('/api/data')
   ↓
2. Request interceptor runs
   ↓
3. getSession() retrieves current session from cookie
   ↓
4. Interceptor adds header: Authorization: Bearer <accessToken>
   ↓
5. Request sent to http://localhost:8008/api/data
   ↓
6. Backend validates token
   ↓
7. Backend returns data
   ↓
8. Response interceptor checks for errors
   ↓
9. Data returned to component
```

---

### Session Expiration

```
1. User's JWT exceeds maxAge (e.g., 24 hours)
   ↓
2. User makes API request
   ↓
3. Backend returns 401 Unauthorized (token expired)
   ↓
4. Response interceptor catches 401 error
   ↓
5. Interceptor redirects: window.location.pathname = '/login'
   ↓
6. User must log in again
```

---

### Logout

**Where:** [src/layout/DashboardLayout/Header/HeaderContent/Profile/index.tsx:39-42](src/layout/DashboardLayout/Header/HeaderContent/Profile/index.tsx#L39-L42)

```typescript
const handleLogout = () => {
  signOut({ redirect: false });
  router.push('/login');
};
```

**What happens:**

1. User clicks logout button
2. `signOut()` called from `next-auth/react`
3. NextAuth clears the session cookie
4. NextAuth POSTs to `/api/auth/signout` to invalidate the session
5. App redirects to `/login`
6. User no longer authenticated

---

## Provider Setup

The entire app is wrapped in authentication and other providers.

**Where:** [src/app/ProviderWrapper.tsx:19-36](src/app/ProviderWrapper.tsx#L19-L36)

```typescript
export default function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider>
      <ThemeCustomization>
        <Locales>
          <ScrollTop>
            <SessionProvider refetchInterval={0}>
              <Notistack>
                <Snackbar />
                {children}
              </Notistack>
            </SessionProvider>
          </ScrollTop>
        </Locales>
      </ThemeCustomization>
    </ConfigProvider>
  );
}
```

**Key component:** `<SessionProvider refetchInterval={0}>`

- Wraps the entire app to provide `useSession()` to all components
- `refetchInterval={0}` disables automatic session refetching
  - **Why?** Sessions don't change often, so refetching constantly wastes resources
  - Sessions are only refetched when explicitly needed (e.g., after login)

---

## Key Takeaways

### Architecture

1. **Dual-service HTTP architecture:**
   - **Credentials Service:** User authentication (Bearer tokens)
   - **Messages Service:** Application data (API key)

2. **JWT-based stateless authentication:**
   - No server-side session storage
   - Scales easily
   - Can't invalidate tokens before expiry

3. **Defense in depth:**
   - Client-side guards (UX, fast feedback)
   - Server-side verification (security, authoritative)

### Configuration

1. **Environment variables are required:**
   - `CREDENTIALS_API_URL` - Authentication backend
   - `MESSAGES_WEB_API_URL` - Data backend
   - `MESSAGES_WEB_API_KEY` - Messages API key
   - `NEXT_APP_JWT_TIMEOUT` - Session duration
   - `NEXT_APP_JWT_SECRET` - JWT signing secret

2. **Fail-fast validation:**
   - App won't start with missing config
   - Clear error messages guide you

### Security

1. **HTTP-only cookies:**
   - JWTs stored in HTTP-only cookies (can't be accessed by JavaScript)
   - Prevents XSS attacks from stealing tokens

2. **Automatic authentication:**
   - Request interceptors add auth headers automatically
   - No manual header management reduces bugs

3. **Automatic error handling:**
   - 401 errors → redirect to login
   - 500 errors → user-friendly messages
   - Connection errors → helpful debugging info

### Developer Experience

1. **Centralized authentication logic:**
   - All config in one place (`authOptions`)
   - Easy to understand and modify

2. **Type-safe API services:**
   - TypeScript interfaces for all API calls
   - Catch errors at compile time

3. **Clean abstractions:**
   - `authApi` and `messagesApi` hide HTTP details
   - Components just call functions, don't worry about URLs or headers

---

## Common Questions

**Q: Why does the backend response have nested data (`response.data.data`)?**

This is how the Credentials API structures its responses. Axios already wraps the response in a `data` property, and the backend adds another `data` level for the actual payload. This pattern is common in REST APIs to separate metadata (status, messages) from the actual data.

**Q: Why use two separate axios instances?**

Because the two backend services use different authentication strategies. Credentials API uses per-user Bearer tokens; Messages API uses a shared API key. Having separate instances with separate interceptors keeps the authentication logic clean and isolated.

**Q: Can I manually call the backend APIs without using the services?**

You could, but you shouldn't. The `authApi` and `messagesApi` services ensure requests are properly authenticated and sent to the correct base URLs. Bypassing them means you'd have to manually handle all that, which is error-prone.

**Q: What happens if my JWT expires while I'm using the app?**

The next API request will fail with a 401 error, and the response interceptor will automatically redirect you to the login page. You'll need to log in again.

**Q: How do I access the current user's information in a component?**

Use the `useUser()` hook:
```typescript
import useUser from 'hooks/useUser';

function MyComponent() {
  const user = useUser();
  if (user) {
    return <div>Welcome, {user.name}!</div>;
  }
  return <div>Not logged in</div>;
}
```

**Q: Can I customize the JWT expiration time?**

Yes, set `NEXT_APP_JWT_TIMEOUT` in your `.env` file (value in seconds).

**Q: What if I need to add authentication to a new backend service?**

Follow the pattern:
1. Add environment variable for the base URL (and API key if needed)
2. Create a new axios instance with validation
3. Add request interceptor for authentication
4. Add response interceptor for error handling
5. Create a service wrapper (like `messagesApi`)
6. Export the service for use in components

---

## Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                                                                  │
│  ┌────────────────┐      ┌──────────────────┐                  │
│  │ Login Form     │──┬──▶│ NextAuth         │                  │
│  │ Register Form  │  │   │ signIn()         │                  │
│  └────────────────┘  │   └──────────────────┘                  │
│                      │            │                             │
│                      │            ▼                             │
│  ┌────────────────┐  │   ┌──────────────────┐                  │
│  │ Protected Page │  │   │ /api/auth/       │                  │
│  │ + AuthGuard    │──┘   │ [...nextauth]    │                  │
│  └────────────────┘      └──────────────────┘                  │
│                                   │                             │
│                                   ▼                             │
│                          ┌─────────────────┐                    │
│                          │ authOptions     │                    │
│                          │ - providers     │                    │
│                          │ - callbacks     │                    │
│                          │ - session       │                    │
│                          └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼                             ▼
         ┌─────────────────────┐       ┌─────────────────────┐
         │ Credentials Service │       │ Messages Service    │
         │ (Bearer Token)      │       │ (API Key)           │
         └─────────────────────┘       └─────────────────────┘
                    │                             │
         ┌──────────┴──────────┐       ┌──────────┴──────────┐
         ▼                     ▼       ▼                     ▼
    ┌─────────┐         ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ /auth/  │         │ /api/   │   │ /protected │   │ Other   │
    │ login   │         │ user/   │   │ /message │   │ endpoints│
    └─────────┘         └─────────┘   └─────────┘   └─────────┘
         │                     │            │              │
         └─────────────────────┴────────────┴──────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │ Backend APIs     │
                    │ - Authentication │
                    │ - Business Logic │
                    └──────────────────┘
```

---

**You now understand how authentication works in this application!** When in doubt, trace through the code starting from the login form and follow the flow through NextAuth, the providers, the axios services, and back to your components.
