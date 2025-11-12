# Form Management and Validation with Formik and Yup

This document explains how to build robust form systems in React using Formik for state management and Yup for schema-based validation. As 400-level CS students, you should be familiar with React hooks, TypeScript, and async operations - we'll build on that foundation to explore production-grade form handling.

---

## Table of Contents

1. [The Problem: Why We Need Form Libraries](#the-problem)
2. [Formik Fundamentals](#formik-fundamentals)
3. [Yup Validation Basics](#yup-validation-basics)
4. [Integration: Formik + Yup](#integration-formik--yup)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Advanced Validation Techniques](#advanced-validation-techniques)
7. [Performance Optimization](#performance-optimization)
8. [TypeScript Integration](#typescript-integration)

---

## The Problem: Why We Need Form Libraries {#the-problem}

### Managing Form State Without Libraries

In vanilla React, managing a login form requires significant boilerplate:

```typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation logic here
    // Submission logic here
  };

  // More handler functions...
}
```

**Problems with this approach:**
- **State explosion**: Each field needs value, error, and touched state
- **Repetitive validation logic**: Similar patterns repeated across forms
- **Manual synchronization**: Keeping UI and state in sync is error-prone
- **Boilerplate accumulation**: More fields = exponentially more code
- **Testing complexity**: Many moving parts to mock and verify

### The Solution: Formik + Yup

**Formik** abstracts form state management into a unified system:
- Centralizes values, errors, touched states, and submission status
- Provides helpers for common operations (handleChange, handleBlur, handleSubmit)
- Manages validation lifecycle automatically

**Yup** provides declarative schema validation:
- Define validation rules as structured schemas (similar to JSON Schema or Zod)
- Composable validators that can be reused across forms
- Built-in TypeScript support for type inference
- Async validation support

**Together**, they reduce a 200-line form component to ~50 lines while improving maintainability.

---

## Formik Fundamentals {#formik-fundamentals}

### Core Concept: Single Source of Truth

Formik uses the **render props pattern** (or hooks) to provide form state and helpers to your component.

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:61-96](src/sections/auth/auth-forms/AuthLogin.tsx#L61-L96)

```typescript
<Formik
  initialValues={{
    email: '',
    password: '',
    submit: null
  }}
  validationSchema={Yup.object().shape({
    email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .test('no-leading-trailing-whitespace', 'Password cannot start or end with spaces', (value) => value === value.trim())
      .min(6, 'Password must be at least 6 characters')
  })}
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
>
  {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
    <form noValidate onSubmit={handleSubmit}>
      {/* Form fields here */}
    </form>
  )}
</Formik>
```

### Breaking Down the Formik Component

#### 1. `initialValues`: The State Schema

```typescript
initialValues={{
  email: '',
  password: '',
  submit: null  // Used for non-field-specific errors
}}
```

**What this does:**
- Defines the shape of your form data (similar to a database schema)
- Each key becomes a tracked field in Formik's state
- Initial values determine types and available fields
- `submit` is a convention for server-side or form-level errors

**CS Concept Connection:** This is essentially defining a **data model** - similar to how you'd define a struct in C++ or a class in Java. Formik maintains an internal state machine that tracks these values through their lifecycle.

#### 2. `onSubmit`: The Submission Handler

```typescript
onSubmit={(values, { setErrors, setSubmitting }) => {
  // values: current form state
  // setErrors: function to programmatically set errors
  // setSubmitting: function to update submission status
}}
```

**What you receive:**
- `values`: The current form state (validated and ready to use)
- `formikBag`: Helper methods including:
  - `setErrors`: Programmatically set field errors (useful for server validation)
  - `setSubmitting`: Toggle the `isSubmitting` flag
  - `resetForm`: Reset to initial state
  - `setFieldValue`: Update a specific field

**Important:** This handler is only called if validation passes. Formik automatically prevents submission on invalid forms.

#### 3. The Render Props Pattern

```typescript
{({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
  // Your JSX here
)}
```

This is a **function-as-child** pattern. Formik calls this function with an object containing:

| Property | Type | Purpose |
|----------|------|---------|
| `values` | `object` | Current form values (e.g., `{ email: "test@example.com" }`) |
| `errors` | `object` | Validation errors (e.g., `{ email: "Invalid email" }`) |
| `touched` | `object` | Which fields have been interacted with (e.g., `{ email: true }`) |
| `handleChange` | `function` | Updates field value on input change |
| `handleBlur` | `function` | Marks field as "touched" on blur |
| `handleSubmit` | `function` | Validates and submits form |
| `isSubmitting` | `boolean` | Whether form is currently submitting |
| `setFieldValue` | `function` | Programmatically set a field value |
| `setFieldError` | `function` | Programmatically set a field error |

**CS Concept:** This is an implementation of the **Observer pattern** - Formik maintains state and notifies your component (the observer) of changes by re-rendering with updated props.

### Connecting Formik to Form Inputs

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:105-121](src/sections/auth/auth-forms/AuthLogin.tsx#L105-L121)

```typescript
<OutlinedInput
  id="email-login"
  type="email"
  value={values.email}              // Controlled component: value from Formik
  name="email"                      // Must match initialValues key
  onBlur={handleBlur}               // Track when user leaves field
  onChange={handleChange}           // Update Formik state
  placeholder="Enter email address"
  fullWidth
  error={Boolean(touched.email && errors.email)}  // Show error styling
/>
{touched.email && errors.email && (
  <FormHelperText error id="standard-weight-helper-text-email-login">
    {errors.email}
  </FormHelperText>
)}
```

**Key integration points:**

1. **`name` attribute**: Must match a key in `initialValues`. Formik uses this to know which field to update.

2. **`value={values.email}`**: Makes this a **controlled component** - React (via Formik) owns the state, not the DOM.

3. **`onChange={handleChange}`**: Formik's generic handler extracts `event.target.name` and `event.target.value` to update state.

4. **`onBlur={handleBlur}`**: Marks the field as "touched" - important for UX (don't show errors until user interacts with field).

5. **Error display pattern**: `touched.email && errors.email`
   - Only show errors after the user has interacted with the field
   - Prevents aggressive "error on load" experience

---

## Yup Validation Basics {#yup-validation-basics}

### Schema-Based Validation

Yup uses a **builder pattern** to create validation schemas:

```typescript
import * as Yup from 'yup';

const schema = Yup.object().shape({
  email: Yup.string()
    .email('Must be a valid email')
    .max(255)
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
});
```

### Built-in Validators

Yup provides validators for common patterns:

| Validator | Example | Purpose |
|-----------|---------|---------|
| `.string()` | `Yup.string()` | Must be a string |
| `.number()` | `Yup.number().positive()` | Must be a number |
| `.email()` | `Yup.string().email()` | Valid email format |
| `.min(n)` | `Yup.string().min(8)` | Minimum length |
| `.max(n)` | `Yup.string().max(255)` | Maximum length |
| `.required()` | `Yup.string().required('Error msg')` | Field is required |
| `.matches()` | `Yup.string().matches(/[A-Z]/)` | Regex validation |
| `.oneOf()` | `Yup.string().oneOf(['admin', 'user'])` | Must be in list |
| `.test()` | `Yup.string().test(...)` | Custom validation |

### Validation from AuthLogin

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:67-73](src/sections/auth/auth-forms/AuthLogin.tsx#L67-L73)

```typescript
validationSchema={Yup.object().shape({
  email: Yup.string()
    .email('Must be a valid email')
    .max(255)
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .test(
      'no-leading-trailing-whitespace',
      'Password cannot start or end with spaces',
      (value) => value === value.trim()
    )
    .min(6, 'Password must be at least 6 characters')
})}
```

**How this works:**

1. **`.string()`**: Type coercion and base validation
   - Ensures value is a string (or coerces it)
   - Returns a `StringSchema` with string-specific validators

2. **`.email('Must be a valid email')`**: Format validation
   - Uses regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Custom error message overrides default

3. **`.max(255)`**: Constraint validation
   - Prevents database overflow (common VARCHAR limit)
   - Uses default error message if not provided

4. **`.required('Email is required')`**: Presence validation
   - Checks for empty string, null, undefined
   - Runs last in the chain (short-circuits if missing)

5. **`.test()`**: Custom validation (see Advanced section)

**Validation order:** Yup validates in the order you chain methods. If `.required()` fails, subsequent validators don't run (short-circuit evaluation).

### Multi-Field Example from AuthRegister

**Where:** [src/sections/auth/auth-forms/AuthRegister.tsx:70-78](src/sections/auth/auth-forms/AuthRegister.tsx#L70-L78)

```typescript
validationSchema={Yup.object().shape({
  firstname: Yup.string().max(255).required('First Name is required'),
  lastname: Yup.string().max(255).required('Last Name is required'),
  email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .test('no-leading-trailing-whitespace', 'Password cannot start or end with spaces', (value) => value === value.trim())
    .max(10, 'Password must be less than 10 characters')
})}
```

**Pattern:** Each field in `initialValues` has a corresponding schema entry. Yup validates all fields in parallel and returns an errors object.

---

## Integration: Formik + Yup {#integration-formik--yup}

### Automatic Validation Lifecycle

When you pass `validationSchema` to Formik:

1. **On mount**: No validation (avoids showing errors immediately)
2. **On field change**: Validates that field after debounce (default: 300ms)
3. **On field blur**: Validates that field immediately
4. **On submit**: Validates entire form before calling `onSubmit`

You can customize this with:

```typescript
<Formik
  validateOnChange={true}   // Default: true
  validateOnBlur={true}     // Default: true
  validateOnMount={false}   // Default: false
  validationSchema={schema}
>
```

### How Validation Flows Through the System

```
User types in field
      ↓
handleChange called
      ↓
Formik updates values state
      ↓
Formik triggers validation (after debounce)
      ↓
Yup schema validates the value
      ↓
Formik updates errors state
      ↓
Component re-renders with new errors
      ↓
UI shows error message (if touched)
```

**Performance note:** Formik uses shallow comparison to prevent unnecessary re-renders. Only components consuming changed values re-render.

### The `touched` Pattern

**Why it exists:**

```typescript
// Bad UX: Shows error immediately on mount
{errors.email && <Error>{errors.email}</Error>}

// Good UX: Shows error only after user interaction
{touched.email && errors.email && <Error>{errors.email}</Error>}
```

A field becomes "touched" when:
- User focuses and then blurs the field (`onBlur` triggers)
- Form is submitted (all fields marked touched)
- You manually call `setFieldTouched('email', true)`

---

## Error Handling Patterns {#error-handling-patterns}

### 1. Field-Level Errors (Validation)

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:117-121](src/sections/auth/auth-forms/AuthLogin.tsx#L117-L121)

```typescript
{touched.email && errors.email && (
  <FormHelperText error id="standard-weight-helper-text-email-login">
    {errors.email}
  </FormHelperText>
)}
```

**Pattern:**
- Check `touched` first (UX consideration)
- Check `errors` exists (validation consideration)
- Render error component with message

### 2. Form-Level Errors (Server Errors)

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:187-191](src/sections/auth/auth-forms/AuthLogin.tsx#L187-L191)

```typescript
{errors.submit && (
  <Grid item xs={12}>
    <FormHelperText error>{errors.submit}</FormHelperText>
  </Grid>
)}
```

**How this gets set:**

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:82-85](src/sections/auth/auth-forms/AuthLogin.tsx#L82-L85)

```typescript
signIn('login', { ... }).then((res: any) => {
  if (res?.error) {
    setErrors({ submit: res.error });  // Server error goes here
    setSubmitting(false);
  }
});
```

**Pattern:**
- Use a non-field key (convention: `submit`) in `initialValues`
- Server errors are set via `setErrors` in `onSubmit`
- No `touched` check needed (only appears after submission attempt)

### 3. Visual Error Indicators

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:114](src/sections/auth/auth-forms/AuthLogin.tsx#L114)

```typescript
<OutlinedInput
  error={Boolean(touched.email && errors.email)}
  // ... other props
/>
```

This adds visual styling (red border, etc.) to the input when there's an error.

**Why `Boolean()`?** Material-UI's `error` prop expects a boolean, but `errors.email` might be a string or undefined. `Boolean(value)` ensures proper type coercion:
- `Boolean("error message")` → `true`
- `Boolean(undefined)` → `false`

---

## Advanced Validation Techniques {#advanced-validation-techniques}

### Custom Validation with `.test()`

**Where:** [src/sections/auth/auth-forms/AuthLogin.tsx:71](src/sections/auth/auth-forms/AuthLogin.tsx#L71)

```typescript
password: Yup.string()
  .required('Password is required')
  .test(
    'no-leading-trailing-whitespace',        // Test name (for debugging)
    'Password cannot start or end with spaces',  // Error message
    (value) => value === value.trim()        // Test function
  )
  .min(6, 'Password must be at least 6 characters')
```

**The `.test()` signature:**

```typescript
.test(
  name: string,
  message: string,
  testFunction: (value: any) => boolean | Promise<boolean>
)
```

**Test function contract:**
- Receives the current field value
- Returns `true` if valid, `false` if invalid
- Can be async (return a Promise)
- Has access to the entire form via `this` context

### Advanced `.test()` with Context

```typescript
password: Yup.string().test(
  'password-match',
  'Passwords must match',
  function(value) {
    return value === this.parent.confirmPassword;
  }
)
```

**Key concept:** `this.parent` gives you access to sibling fields (the parent object containing all form values).

**Why `function()` not arrow function?** Arrow functions don't have their own `this` context. You need `function()` to access Yup's context.

### Async Validation Example

```typescript
username: Yup.string()
  .required('Username is required')
  .test(
    'username-unique',
    'Username already taken',
    async (value) => {
      if (!value) return true; // Skip if empty (handled by .required())
      const response = await fetch(`/api/check-username?username=${value}`);
      const data = await response.json();
      return data.available;
    }
  )
```

**Performance consideration:** Async validation can be expensive. Formik debounces by default (300ms), but consider:
- Adding your own debouncing for expensive checks
- Using `validateOnChange: false` for async validators
- Implementing client-side checks first (format, length) before server checks

### Conditional Validation

```typescript
validationSchema: Yup.object().shape({
  accountType: Yup.string().required(),
  businessName: Yup.string().when('accountType', {
    is: 'business',
    then: (schema) => schema.required('Business name is required'),
    otherwise: (schema) => schema.notRequired()
  })
})
```

**Pattern:** Use `.when()` to make validation depend on other field values.

### Cross-Field Validation

```typescript
validationSchema: Yup.object().shape({
  password: Yup.string().required(),
  confirmPassword: Yup.string()
    .required()
    .oneOf([Yup.ref('password')], 'Passwords must match')
})
```

**`Yup.ref('password')`** creates a reference to another field's value. Common for confirmation fields.

### Dynamic Schema Example

```typescript
const getValidationSchema = (userType: string) => {
  const baseSchema = {
    email: Yup.string().email().required(),
    password: Yup.string().required()
  };

  if (userType === 'admin') {
    return Yup.object().shape({
      ...baseSchema,
      adminCode: Yup.string().required('Admin code is required')
    });
  }

  return Yup.object().shape(baseSchema);
};

// Usage in Formik
<Formik validationSchema={getValidationSchema(userType)}>
```

**Use case:** Forms where validation rules change based on user selections, permissions, or app state.

---

## Performance Optimization {#performance-optimization}

### 1. Minimize Re-renders with Field-Level Components

**Problem:** Large forms re-render on every keystroke.

**Solution:** Use `<Field>` component or `useField()` hook.

```typescript
import { Field, useField } from 'formik';

function EmailField() {
  const [field, meta] = useField('email');

  return (
    <>
      <input {...field} type="email" />
      {meta.touched && meta.error && <div>{meta.error}</div>}
    </>
  );
}

// In Formik
<Formik initialValues={{ email: '' }}>
  <EmailField />
</Formik>
```

**Why this helps:** `useField()` subscribes only to changes for that specific field, not the entire form state.

### 2. Debouncing Validation

```typescript
<Formik
  validationSchema={schema}
  validateOnChange={true}
  // Formik debounces by default, but you can customize:
>
```

For expensive async validation, consider additional debouncing:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedValidation = useDebouncedCallback(
  (value) => validateUsername(value),
  1000
);
```

### 3. Lazy Validation Schemas

```typescript
const validationSchema = Yup.lazy((values) => {
  return Yup.object().shape({
    // Build schema based on current values
  });
});
```

**Use case:** When schema structure depends on form values (e.g., dynamic fields).

### 4. Memo-ize Expensive Calculations

**Where:** [src/sections/auth/auth-forms/AuthRegister.tsx:176-179](src/sections/auth/auth-forms/AuthRegister.tsx#L176-L179)

```typescript
onChange={(e) => {
  handleChange(e);
  changePassword(e.target.value);  // Expensive operation
}}
```

If `changePassword` is expensive, memo-ize it:

```typescript
const changePassword = useMemo(() => {
  return (value: string) => {
    const temp = strengthIndicator(value);
    setLevel(strengthColor(temp));
  };
}, [/* dependencies */]);
```

---

## TypeScript Integration {#typescript-integration}

### Typing Form Values

```typescript
interface LoginFormValues {
  email: string;
  password: string;
  submit: string | null;
}

<Formik<LoginFormValues>
  initialValues={{
    email: '',
    password: '',
    submit: null
  }}
  onSubmit={(values: LoginFormValues) => {
    // values is fully typed
    console.log(values.email); // ✅ TypeScript knows this is a string
  }}
>
```

### Inferring Types from Yup Schema

```typescript
import { InferType } from 'yup';

const loginSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().required()
});

type LoginFormValues = InferType<typeof loginSchema>;
// Equivalent to:
// {
//   email: string;
//   password: string;
// }
```

**Best practice:** Define schema first, infer types from it. This ensures your TypeScript types and validation stay in sync.

### Typing the FormikBag

```typescript
onSubmit={(
  values: LoginFormValues,
  { setErrors, setSubmitting }: FormikHelpers<LoginFormValues>
) => {
  // Fully typed
}}
```

### Typing Custom Validation

```typescript
.test(
  'password-strength',
  'Password too weak',
  function(value: string | undefined): boolean {
    if (!value) return false;
    return value.length >= 8 && /[A-Z]/.test(value);
  }
)
```

**Note:** The return type annotation ensures TypeScript catches errors if you accidentally return a non-boolean.

---

## Real-World Patterns and Best Practices

### 1. Separating Schema Definitions

**Pattern:** Keep validation schemas in separate files for reusability.

```typescript
// validations/auth.validation.ts
export const loginValidationSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().min(6).required()
});

export const registerValidationSchema = Yup.object().shape({
  firstname: Yup.string().required(),
  lastname: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string().min(6).max(10).required()
});

// In component
import { loginValidationSchema } from 'validations/auth.validation';

<Formik validationSchema={loginValidationSchema}>
```

### 2. Reusable Field Components

```typescript
// components/FormFields/EmailField.tsx
export function EmailField({ name = 'email', label = 'Email Address' }) {
  const [field, meta] = useField(name);

  return (
    <Stack spacing={1}>
      <InputLabel htmlFor={name}>{label}</InputLabel>
      <OutlinedInput
        {...field}
        type="email"
        error={Boolean(meta.touched && meta.error)}
      />
      {meta.touched && meta.error && (
        <FormHelperText error>{meta.error}</FormHelperText>
      )}
    </Stack>
  );
}

// Usage
<Formik initialValues={{ email: '' }}>
  <EmailField />
</Formik>
```

### 3. Handling Server-Side Validation

```typescript
onSubmit={async (values, { setErrors, setFieldError }) => {
  try {
    await api.login(values);
  } catch (error) {
    if (error.response?.data?.errors) {
      // Server returns field-specific errors
      const serverErrors = error.response.data.errors;
      Object.keys(serverErrors).forEach(field => {
        setFieldError(field, serverErrors[field]);
      });
    } else {
      // Generic error
      setErrors({ submit: 'Login failed. Please try again.' });
    }
  }
}}
```

### 4. Progressive Enhancement Pattern

Start with basic validation, add complexity as needed:

```typescript
// Level 1: Basic validation
email: Yup.string().email().required()

// Level 2: Add constraints
email: Yup.string().email().max(255).required('Email is required')

// Level 3: Add custom rules
email: Yup.string()
  .email()
  .max(255)
  .required('Email is required')
  .test('no-disposable', 'Disposable emails not allowed',
    (value) => !value?.includes('tempmail.com'))

// Level 4: Add async validation
email: Yup.string()
  .email()
  .max(255)
  .required()
  .test('unique', 'Email already registered',
    async (value) => {
      const response = await checkEmailAvailability(value);
      return response.available;
    })
```

### 5. Form Reset After Successful Submission

```typescript
onSubmit={async (values, { setSubmitting, resetForm }) => {
  try {
    await api.createAccount(values);
    resetForm(); // Clear the form
    router.push('/success');
  } catch (error) {
    setSubmitting(false);
  }
}}
```

---

## Debugging Tips

### 1. Enable Formik DevTools

```typescript
<Formik
  initialValues={...}
  onSubmit={...}
>
  {(formikProps) => (
    <>
      <pre>{JSON.stringify(formikProps, null, 2)}</pre>
      <form>...</form>
    </>
  )}
</Formik>
```

This displays the entire Formik state in real-time during development.

### 2. Log Validation Errors

```typescript
validationSchema={Yup.object().shape({...})}
validate={(values) => {
  console.log('Validating:', values);
  return {}; // Return custom errors if needed
}}
```

### 3. Check Schema Directly

```typescript
const schema = Yup.object().shape({...});

// Test synchronously
try {
  schema.validateSync({ email: 'invalid', password: '123' });
} catch (error) {
  console.log(error.errors); // Array of error messages
}

// Test async
schema.validate({ email: 'test@example.com', password: 'pass123' })
  .then(valid => console.log('Valid:', valid))
  .catch(error => console.log('Errors:', error.errors));
```

---

## Summary: Key Takeaways

**Formik provides:**
- Centralized form state management
- Automatic validation lifecycle
- Helpers to reduce boilerplate
- TypeScript-friendly API

**Yup provides:**
- Declarative validation schemas
- Composable validators
- Type inference for TypeScript
- Async validation support

**Together they solve:**
- State management complexity
- Repetitive validation code
- Poor UX (showing errors at wrong times)
- Type safety concerns
- Testing difficulties

**Best practices:**
1. Always use `touched && errors` pattern for displaying errors
2. Keep validation schemas separate from components
3. Use TypeScript with `InferType` for type safety
4. Leverage `.test()` for custom business logic
5. Consider performance with large forms (use `useField`)
6. Handle both client and server validation
7. Test your validation schemas independently

**Next steps:**
- Build a complete form with validation
- Implement async validation with server checks
- Create reusable field components
- Add unit tests for validation schemas
- Explore Formik alternatives (React Hook Form, Final Form)

---

## Additional Resources

- [Formik Documentation](https://formik.org/docs/overview)
- [Yup GitHub Repository](https://github.com/jquense/yup)
- [Form Validation UX Best Practices](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- TypeScript: `InferType<typeof schema>` for type generation
- Alternative: React Hook Form (more performant for very large forms)
