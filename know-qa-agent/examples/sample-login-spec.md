# Login Flow

## Overview

The login flow allows users to authenticate and access their personalized dashboard. This is a critical path - if login is broken, users cannot access the application.

## Base URL

<http://localhost:3000>

## Personas

- unauthenticated user (starting state)
- user with valid credentials: test@example.com / password123
- user with invalid credentials: wrong@example.com / wrongpass

## Viewports

- desktop (1280x720)
- mobile (375x667)

## Environments

### local

base_url: <http://localhost:3000>
credentials: test@example.com / password123
timeouts: {}
flags: {}

### staging

base_url: <https://staging.example.com>
credentials: test@staging.example.com / $STAGING_PASSWORD
timeouts:
  api: 3000
flags: {}

## Accessibility Focus

- form-accessibility

## Test Scenarios

### 1. Successful Login

tags: [smoke, critical]
Starting as an unauthenticated user with valid credentials.

**Steps:**

1. Navigate to /login
2. Verify the login form is visible and properly rendered
3. Enter email: test@example.com
4. Enter password: password123
5. Click the "Sign In" button

**Expected:**

- Loading state appears on button while request is in flight
- On success, redirect to /dashboard
- Dashboard shows "Welcome back, Test User" (or similar personalized greeting)
- Navigation updates to show authenticated state (logout option visible, login option hidden)
- No console errors
- Network: POST /api/auth/login returns 200
- Auth token is stored (check localStorage or cookie, not URL)

### 2. Failed Login - Invalid Credentials

tags: [smoke, regression]
Tests multiple invalid credential combinations to verify consistent error handling.

**Steps:**

1. Navigate to /login
2. Enter email: {email}
3. Enter password: {password}
4. Click "Sign In"

**Expected:**

- {expected_result}
- User remains on /login page
- Password field is cleared (security best practice)
- Email field retains value (convenience)
- No console errors
- Network: POST /api/auth/login returns {expected_status}

## Data Sets

### wrong-credentials

email: wrong@example.com
password: wrongpass
expected_result: Error message appears — "Invalid email or password" (or similar)
expected_status: 401

### expired-account

email: expired@example.com
password: password123
expected_result: Error message indicates the account is expired or inactive
expected_status: 401 or 403

### locked-account

email: locked@example.com
password: password123
expected_result: Error message indicates account is locked, with support contact guidance
expected_status: 401 or 403

### 3. Failed Login - Empty Form

tags: [regression]

**Steps:**

1. Navigate to /login
2. Click "Sign In" without entering anything

**Expected:**

- Validation errors appear for required fields
- Form is NOT submitted to server (client-side validation)
- Focus moves to first invalid field

### 4. Failed Login - Invalid Email Format

tags: [regression]

**Steps:**

1. Navigate to /login
2. Enter email: notanemail
3. Enter password: somepassword
4. Click "Sign In"

**Expected:**

- Validation error indicates email format is invalid
- Form is NOT submitted to server

### 5. Session Persistence

tags: [regression]
depends_on: 1. Successful Login

**Steps:**

1. Complete successful login (Scenario 1)
2. Refresh the page
3. Close tab and open new tab to /dashboard

**Expected:**

- User remains logged in after refresh
- User remains logged in in new tab
- No re-authentication required

### 6. Logout Flow

tags: [smoke]
depends_on: 1. Successful Login

**Steps:**

1. Complete successful login
2. Click "Logout" (or equivalent)

**Expected:**

- User is redirected to /login (or home page)
- Auth token is cleared
- Attempting to access /dashboard redirects to /login
- No console errors

## Edge Cases to Verify

- **SQL injection attempt**: Enter `'; DROP TABLE users; --` as email
  - Expected: Treated as invalid email, no server error

- **XSS attempt**: Enter `<script>alert('xss')</script>` as email
  - Expected: Properly escaped, no script execution

- **Very long input**: Enter 1000+ character string
  - Expected: Either truncated or validation error, no crash

- **Rapid submit**: Click submit multiple times quickly
  - Expected: Only one request sent (button disabled during request)

- **Back button after login**: Complete login, then click browser back
  - Expected: Either stay on dashboard or redirect back to dashboard (not show login form to authenticated user)

## Things to Watch For

- **Performance**: Login API should respond in under 500ms
- **Security**:
  - Password field should be type="password"
  - Auth token should NOT appear in URL
  - Failed login should not reveal whether email exists (avoid "email not found" vs "wrong password" distinction)
- **Accessibility**:
  - Form fields should have visible labels
  - Error messages should be announced to screen readers
  - Submit should be possible via Enter key, not just button click

## Known Issues

None currently tracked.
