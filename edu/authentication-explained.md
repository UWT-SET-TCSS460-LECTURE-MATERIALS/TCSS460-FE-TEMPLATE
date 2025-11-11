# Authentication System Overview

This application uses **NextAuth.js** (also called Auth.js), a popular authentication library for Next.js applications. Think of NextAuth as a pre-built authentication framework that handles the complex parts of user login/logout for you.

**For the professor:** NextAuth abstracts away session management, JWT handling, and provider configuration, giving you a standardized auth API similar to Passport.js but optimized for Next.js's server/client architecture.

**For the student:** Instead of building login systems from scratch (which is complex and security-sensitive), NextAuth provides ready-to-use tools. It's like using a trusted library instead of reinventing the wheel.

---

## Step 0: Backend API Configuration - How NextAuth Knows Where to Connect

**What happens:** Before authentication can work, the application needs to know the URL of your backend API server where login/register endpoints exist.

**Where:** [src/utils/axios.ts:6-14](src/utils/axios.ts#L6-L14)

```typescript
import axios, { AxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

if (!process.env.CREDENTIALS_API_URL) {
  throw new Error(
    'CREDENTIALS_API_URL environment variable is not set. ' +
    'Please add CREDENTIALS_API_URL to your .env file. ' +
    'Example: CREDENTIALS_API_URL=http://localhost:8008'
  );
}

const axiosServices = axios.create({
  baseURL: process.env.CREDENTIALS_API_URL
});
```

### How it works:

**For the professor:** This creates a configured Axios instance with a base URL. The `baseURL` is set from an environment variable (`CREDENTIALS_API_URL`). Unlike many implementations that use fallback values, this code fails fast with a clear error message if the environment variable is not set. This follows the twelve-factor app methodology with strict environment validation - preventing silent failures and misconfiguration in production.

**For the student:** Think of this as setting your phone's area code. Instead of dialing the full number every time (like `http://localhost:8008/auth/login`), you just set the base once (`http://localhost:8008/`) and then only need to dial the extension (`/auth/login`). The base URL comes from a special file called `.env` that stores configuration settings. If you forget to set it up, the app will immediately tell you what's wrong instead of silently failing.

### Environment Variable Configuration

**Where to set it:** In your `.env` file at the project root:

```bash
CREDENTIALS_API_URL=http://localhost:8008
# For production, you might have:
# CREDENTIALS_API_URL=https://api.yourdomain.com/
```

**For the professor:** Environment variables provide deployment flexibility. Development, staging, and production can each point to different backend servers without code changes. Next.js loads `.env` files automatically and makes them available via `process.env`. The code validates this variable exists at startup, preventing runtime errors from misconfiguration.

**For the student:** The `.env` file is like a settings file that changes based on where your app is running. When coding on your laptop, it points to `http://localhost:8008`. When deployed to production, it points to your real server URL like `https://api.yourcompany.com/`. This setting is **required** - the app won't start without it.

### How authOptions Uses This Configured Axios

**Where:** [src/utils/authOptions.ts:6](src/utils/authOptions.ts#L6) and [authOptions.ts:32-34](src/utils/authOptions.ts#L32-L34)

```typescript
// Import the configured axios instance
import axios from 'utils/axios';

// Later, in the login provider:
async authorize(credentials) {
  const response = await axios.post('/auth/login', {
    password: credentials?.password,
    email: credentials?.email
  });

  // Response has nested data structure
  const data = response.data.data;
  data.user['accessToken'] = data.accessToken;
  return data.user;
}
```

**For the professor:** The authOptions imports the pre-configured axios instance (not the raw axios library). When it makes a request to `/auth/login`, Axios prepends the baseURL, resulting in a request to `http://localhost:8008/auth/login` (or whatever CREDENTIALS_API_URL is set to). This demonstrates separation of concerns - authOptions doesn't need to know the backend URL; it's configured centrally in one place. Note the nested response structure: the actual data is in `response.data.data`, requiring an extra level of access.

**For the student:** When the code says `axios.post('/auth/login', ...)`, it's actually sending a request to the full URL: `http://localhost:8008/auth/login`. The `/auth/login` part gets added to the base URL automatically. This way, if you need to change the server address, you only change it in one place (the `.env` file) instead of updating it everywhere in your code. The response from your server has the real data nested one level deeper, so we access it with `response.data.data`.

### Complete URL Construction Example

Here's how the URLs are built:

1. **Environment Variable**: `CREDENTIALS_API_URL=http://localhost:8008`
2. **Validation**: Code checks the env var exists, throws error if missing
3. **Axios Base**: axios is configured with base `http://localhost:8008`
4. **Login Request**: `axios.post('/auth/login', ...)` → Full URL: `http://localhost:8008/auth/login`
5. **Register Request**: `axios.post('/auth/register', ...)` → Full URL: `http://localhost:8008/auth/register`

**For the professor:** This architectural pattern enables:
- **DRY principle**: Single source of truth for the backend URL
- **Environment parity**: Same codebase works across dev/staging/prod
- **Easy testing**: Can swap to a mock server by changing one environment variable
- **Security**: Credentials and URLs aren't hardcoded in source control
- **Fail-fast validation**: Application won't start with missing configuration, preventing runtime errors

**For the student:** Summary:
- `.env` file stores the backend server address (e.g., `http://localhost:8008`)
- The app checks this setting exists when it starts
- If missing, you'll get a helpful error message with instructions
- Axios reads it once when the app starts
- Every API call automatically uses that address
- To change servers, just update the `.env` file

---

## Step 1: NextAuth Configuration

**What happens:** The authentication system is configured with providers, callbacks, and session settings.

**Where:** [src/utils/authOptions.ts:21-112](src/utils/authOptions.ts#L21-L112)

```typescript
export const authOptions: NextAuthOptions = {
  providers: [...],
  callbacks: {...},
  session: { strategy: 'jwt', ... },
  pages: { signIn: '/login', ... }
}
```

**Key components:**

### 1.1 Providers

**Where:** [src/utils/authOptions.ts:22-81](src/utils/authOptions.ts#L22-L81)

Two "CredentialsProvider" configurations exist - one for login, one for registration:

```typescript
CredentialsProvider({
  id: 'login',
  name: 'login',
  async authorize(credentials) {
    const response = await axios.post('/auth/login', {
      password: credentials?.password,
      email: credentials?.email
    });

    // Extract data from nested response structure
    const data = response.data.data;
    data.user['accessToken'] = data.accessToken;
    return data.user;
  }
})
```

**For the professor:** Unlike OAuth providers (Google, GitHub), CredentialsProvider lets you implement custom authentication logic. The `authorize` function is analogous to a Passport local strategy - it receives credentials and must return a user object or throw an error. Note the nested response structure where the credentials API returns data in `response.data.data` rather than directly in `response.data`.

**For the student:** A "provider" is a way to log in. This app has two custom providers (login and register) that talk to your backend API. When someone enters their email/password, this code sends it to your server at `/auth/login` or `/auth/register`. Your server's response has data nested inside another data object, so we need to access it with `response.data.data`.

**Important detail:** The response includes an `accessToken` which gets attached to the user object ([src/utils/authOptions.ts:43](src/utils/authOptions.ts#L43), [src/utils/authOptions.ts:73](src/utils/authOptions.ts#L73)). This token will be used for subsequent API calls.

### 1.2 JWT Callback

**Where:** [src/utils/authOptions.ts:83-91](src/utils/authOptions.ts#L83-L91)

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

**For the professor:** This callback runs when a JWT is created or updated. It's where you enrich the JWT payload with custom data. The `user` object is only available on initial sign-in, so we extract the accessToken here and persist it in the JWT.

**For the student:** A JWT (JSON Web Token) is like a secure digital ID card. This code puts the user's access token and ID into that "ID card" so it can be carried around with every request.

### 1.3 Session Callback

**Where:** [src/utils/authOptions.ts:92-99](src/utils/authOptions.ts#L92-L99)

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

**For the professor:** This determines what data is exposed to the client via `useSession()`. The token (JWT payload) is mapped to the session object that React components can access.

**For the student:** When your React code asks "who is logged in?", this callback decides what information to send back. It takes data from the JWT and makes it available to your components.

### 1.4 Session Strategy

**Where:** [src/utils/authOptions.ts:101-107](src/utils/authOptions.ts#L101-L107)

```typescript
session: {
  strategy: 'jwt',
  maxAge: Number(process.env.NEXT_APP_JWT_TIMEOUT!)
},
jwt: {
  secret: process.env.NEXT_APP_JWT_SECRET
}
```

**For the professor:** JWT strategy means sessions are stateless and encoded in a signed token rather than stored server-side. This is scalable but means you can't invalidate tokens server-side (they're valid until expiry).

**For the student:** Instead of the server remembering who's logged in (like keeping a list), the user's browser stores a secure token. The server just checks if the token is valid each time.

---

## Step 2: NextAuth API Route

**What happens:** NextAuth needs a special API endpoint to handle authentication requests.

**Where:** [src/app/api/auth/[...nextauth]/route.ts:1-6](src/app/api/auth/[...nextauth]/route.ts#L1-L6)

```typescript
import { authOptions } from 'utils/authOptions';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**For the professor:** Next.js 13+ uses the App Router with route handlers. The `[...nextauth]` catch-all route handles all NextAuth endpoints (`/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`, etc.). Exporting the handler as both GET and POST makes it handle both HTTP methods.

**For the student:** The `[...nextauth]` folder name is special syntax in Next.js that means "catch all URLs starting with `/api/auth/`". So `/api/auth/signin`, `/api/auth/signout`, etc., all go through this one file. It's like a wildcard route.

---

## Step 3: Login Form

**What happens:** User enters credentials and submits the login form.

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

**For the professor:** `signIn()` is NextAuth's client-side function imported from `next-auth/react` ([src/sections/auth/auth-forms/AuthLogin.tsx:7](src/sections/auth/auth-forms/AuthLogin.tsx#L7)). The first argument (`'login'`) matches the provider ID from authOptions. Setting `redirect: false` gives you programmatic control over post-login behavior instead of automatic redirects.

**For the student:** When the user clicks "Login", Formik validates the form, then calls NextAuth's `signIn` function. This sends the email/password to the backend. If it succeeds, the app preloads some data; if it fails, an error message is shown.

**Key points:**
- Uses Formik for form management and validation ([src/sections/auth/auth-forms/AuthLogin.tsx:61-204](src/sections/auth/auth-forms/AuthLogin.tsx#L61-L204))
- Yup schema validates email format and password requirements ([src/sections/auth/auth-forms/AuthLogin.tsx:67-73](src/sections/auth/auth-forms/AuthLogin.tsx#L67-L73))
- The 'login' string matches the provider ID in authOptions ([src/utils/authOptions.ts:24](src/utils/authOptions.ts#L24))

---

## Step 4: Registration Form

**What happens:** Similar to login, but for new users creating accounts.

**Where:** [src/sections/auth/auth-forms/AuthRegister.tsx:80-96](src/sections/auth/auth-forms/AuthRegister.tsx#L80-L96)

```typescript
onSubmit={async (values, { setErrors, setSubmitting }) => {
  const trimmedEmail = values.email.trim();
  signIn('register', {
    redirect: false,
    firstname: values.firstname,
    lastname: values.lastname,
    email: trimmedEmail,
    password: values.password,
    callbackUrl: APP_DEFAULT_PATH
  }).then((res: any) => {
    if (res?.error) {
      setErrors({ submit: res.error });
      setSubmitting(false);
    }
  });
}}
```

**For the professor:** Note that registration also uses `signIn()` but with the 'register' provider. This is a common pattern where the `authorize` function handles both creating the account and returning the initial session in one step.

**For the student:** Registration works similarly to login - it uses the 'register' provider which calls your `/auth/register` API endpoint, creates the account, and logs the user in all at once.

---

## Step 5: Backend Communication via Axios

**What happens:** All API requests to your backend server include the authentication token automatically.

**Where:** [src/utils/axios.ts:10-21](src/utils/axios.ts#L10-L21)

```typescript
axiosServices.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.token.accessToken) {
      config.headers['Authorization'] = `Bearer ${session?.token.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

**For the professor:** Axios interceptors work like middleware - they intercept every request before it's sent. `getSession()` fetches the current NextAuth session (which includes our JWT with the accessToken). This pattern centralizes auth header injection, so individual API calls don't need to manually add auth headers.

**For the student:** Think of an interceptor as a checkpoint. Before any request goes to your server, this code automatically checks if the user is logged in and adds their authentication token to the request headers. It's like automatically showing your ID card every time you enter a building.

**Response interceptor** ([src/utils/axios.ts:23-40](src/utils/axios.ts#L23-L40)) handles errors:
- Status 401 (Unauthorized) → redirects to login
- Status 500+ → shows user-friendly error
- Connection refused → shows specific error message

---

## Step 6: Protected Routes

**What happens:** Components that require authentication are wrapped in this guard.

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

**For the professor:** This is a higher-order component pattern. It uses the `useSession()` hook to check auth status client-side, and additionally verifies server-side via the `/api/auth/protected` endpoint. The dual check provides defense in depth - client-side for UX (immediate feedback) and server-side for security (canonical source of truth).

**For the student:** This is a "guard" or "wrapper" component. If you wrap a page with `<AuthGuard>`, it checks if the user is logged in. If not logged in, it redirects to the login page. If logged in, it shows the page content (the `children`).

**Protected API endpoint** ([src/app/api/auth/protected/route.ts](src/app/api/auth/protected/route.ts)):

```typescript
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session) {
    return NextResponse.json({ protected: true });
  } else {
    return NextResponse.json({ protected: false });
  }
}
```

---

## Step 7: Accessing User Data

**What happens:** Components can get the current user's information.

**Where:** [src/hooks/useUser.ts:12-39](src/hooks/useUser.ts#L12-L39)

```typescript
export default function useUser() {
  const { data: session } = useSession();
  if (session) {
    const user = session?.user;
    const provider = session?.provider;
    // ... formatting logic ...
    return newUser;
  }
  return false;
}
```

**For the professor:** This custom hook wraps `useSession()` and normalizes the user object structure. It provides a consistent interface for components, handling edge cases like missing avatar images or different provider formats.

**For the student:** This is a reusable hook (a special React function). Any component can call `useUser()` to get information about the logged-in user (name, email, avatar, etc.). It returns `false` if no one is logged in.

**Used in components** like [src/layout/DashboardLayout/Header/HeaderContent/Profile/index.tsx:36](src/layout/DashboardLayout/Header/HeaderContent/Profile/index.tsx#L36):

```typescript
const user = useUser();
// ... later ...
{user && (
  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 0.5 }}>
    <Avatar alt={user.name} src={user.avatar} size="sm" />
    <Typography variant="subtitle1">{user.name}</Typography>
  </Stack>
)}
```

---

## Step 8: Logout

**What happens:** User clicks logout button to end their session.

**Where:** [src/layout/DashboardLayout/Header/HeaderContent/Profile/index.tsx:39-42](src/layout/DashboardLayout/Header/HeaderContent/Profile/index.tsx#L39-L42)

```typescript
const handleLogout = () => {
  signOut({ redirect: false });
  router.push('/login');
};
```

**For the professor:** `signOut()` from `next-auth/react` clears the session cookie and JWT. With `redirect: false`, you control the post-logout navigation programmatically. The session is cleared both client-side and via a call to `/api/auth/signout`.

**For the student:** When the user clicks logout, `signOut()` clears their login session (removes the JWT token), then the app redirects them to the login page. They're no longer authenticated.

---

## Complete Authentication Flow Summary

### Login Flow:
1. **Backend URL validated** from `.env` file via [axios.ts](src/utils/axios.ts) (e.g., `http://localhost:8008`)
2. User enters email/password in [AuthLogin.tsx](src/sections/auth/auth-forms/AuthLogin.tsx)
3. Form calls `signIn('login', credentials)`
4. NextAuth routes to [/api/auth/[...nextauth]](src/app/api/auth/[...nextauth]/route.ts)
5. The 'login' provider's `authorize` function calls backend using configured axios ([src/utils/authOptions.ts:33-44](src/utils/authOptions.ts#L33-L44))
   - Sends POST to `{baseURL}/auth/login` (e.g., `http://localhost:8008/auth/login`)
   - Extracts data from nested response: `response.data.data`
6. Backend validates credentials, returns nested data with user + accessToken
7. JWT callback stores accessToken in the JWT ([src/utils/authOptions.ts:83-91](src/utils/authOptions.ts#L83-L91))
8. Session callback makes user data available to client ([src/utils/authOptions.ts:92-99](src/utils/authOptions.ts#L92-L99))
9. Client can now access session via `useSession()` hook

### Protected Page Access:
1. User navigates to protected page wrapped in [AuthGuard](src/utils/route-guard/AuthGuard.tsx)
2. AuthGuard checks `useSession()` status
3. If authenticated, shows page content
4. If not authenticated, redirects to [/login](src/sections/auth/auth-forms/AuthLogin.tsx)

### API Requests (After Login):
1. Component makes API call using configured [axios](src/utils/axios.ts) instance
2. Request interceptor gets current session ([src/utils/axios.ts:20](src/utils/axios.ts#L20))
3. Adds `Authorization: Bearer <token>` header automatically ([src/utils/axios.ts:22](src/utils/axios.ts#L22))
4. Request sent to `{baseURL}/{endpoint}` (e.g., `http://localhost:8008/api/messages`)
5. Backend receives authenticated request with token
6. If 401 response, redirects to login ([src/utils/axios.ts:35-36](src/utils/axios.ts#L35-L36))

---

## Key Takeaways

**For the professor:**
- **Environment-based configuration**: Backend URL configured via environment variables following twelve-factor app principles
- **JWT-based stateless authentication** with configurable expiry
- **Credentials provider** enables custom authentication logic while leveraging NextAuth's session management
- **Axios interceptors** centralize both URL configuration and auth header injection
- **Defense in depth**: client-side guards (UX) + server-side validation (security)

**For the student:**
- Backend server address is **required** in the `.env` file (e.g., `CREDENTIALS_API_URL=http://localhost:8008`)
- The app validates this setting exists on startup - you'll get a clear error if it's missing
- Axios automatically adds this base URL to all API requests
- Your credentials server returns data in a nested format (`response.data.data`)
- NextAuth handles the complex security stuff for you
- JWT tokens act like secure ID cards that prove who you are
- Guards protect pages from unauthorized access
- Axios automatically adds authentication to API calls
- The flow: Validate Config → Login → Get Token → Use Token for API Calls → Logout clears Token
