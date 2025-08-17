# Gemini Development Rules for the Admin Project

This document outlines critical rules and common pitfalls encountered during the development of this admin project. Adherence to these rules is mandatory to prevent recurring errors and ensure stability.

### 1. API Response Consistency: Always Return JSON
**Problem:** Frontend expects JSON, but backend sometimes returns plain text (e.g., "Forbidden") or HTML (for 404s), causing parsing errors (`Unexpected token '<'`, `Unexpected token 'F'`).
**Rule:** **All API endpoints, for both success and error responses, MUST return a valid JSON object.**
- **Correct (Success):** `res.status(200).json({ data: ... })`
- **Correct (Error):** `res.status(403).json({ error: "Forbidden" })`
- **Incorrect:** `res.sendStatus(403)`, `res.send("Error")`

### 2. API Routing Integrity: No Prefix Duplication
**Problem:** 404 Not Found errors occurred because API paths were duplicated between `backend/src/index.ts` and route files in `backend/src/routes/`.
**Rule:** **Route files in `src/routes/` MUST use relative paths starting from `/`.** The main path prefix (e.g., `/api/users`) is defined ONLY in `src/index.ts`.
- **`src/index.ts`:** `app.use('/api/users', usersRoutes);`
- **`src/routes/users.ts`:** `router.get('/', ...)` (Correct)
- **`src/routes/users.ts`:** `router.get('/users', ...)` (Incorrect - results in `/api/users/users`)

### 3. JWT & Environment Variable Integrity
**Problem:** "Forbidden: Invalid token" errors occur when the backend fails to correctly load the `JWT_SECRET` from the `.env` file.
**Rule:** **The backend server MUST explicitly load environment variables at the very top of the main entry file (`src/index.ts`).** This ensures all modules, especially the authentication middleware, have access to the correct `JWT_SECRET` for token verification.
- **`src/index.ts`:**
  ```typescript
  import dotenv from 'dotenv';
  dotenv.config(); // This MUST be at the top

  import express from 'express';
  // ... rest of the file
  ```

### 4. Zod Error Handling
**Problem:** `TypeError: Cannot read properties of undefined (reading 'errors')` when handling Zod validation errors.
**Rule:** **When catching a `ZodError`, the detailed validation issues are in the `error.issues` property, NOT `error.errors`.**
- **Correct:** `return res.status(400).json({ error: 'Invalid input', details: error.issues });`
- **Incorrect:** `return res.status(400).json({ error: 'Invalid input', details: error.errors });`

### 5. Component Import Integrity
**Problem:** Vite build error `Failed to resolve import... Does the file exist?` for UI components.
**Rule:** **Before importing a component, VERIFY THE FILE EXISTS. All UI component files use `PascalCase` (e.g., `DataTable.tsx`). Import statements MUST match the exact, case-sensitive filename.**
- **Verification:** Use `ls` or `glob` to check the `src/components/ui` directory first.
- **Correct:** `import { Card } from '@/components/ui/Card';`
- **Incorrect (Casing):** `import { Card } from '@/components/ui/card';`
- **Incorrect (File Missing):** Attempting to import a component that has not been created.

### 6. Component Dependency Integrity
**Problem:** `Failed to resolve import...` for third-party libraries like `@radix-ui`.
**Rule:** When creating a new UI component based on a library (e.g., shadcn/ui, Radix), **you MUST verify that the necessary dependency is listed in `package.json` and installed.** If it's not, install it immediately.
- **Action:** `npm install @radix-ui/react-component-name`
- **Verification:** Check `package.json` after installation.

### 7. Post-Modification Verification (CRITICAL)
**Problem:** Automated changes (e.g., using `replace`) introduce syntax errors, causing the application to crash.
**Rule:** **After ANY automated or bulk modification of code, you MUST immediately run a verification command.** For the frontend, this is `npm run build`. For the backend, it's `npm run build`. This is a non-negotiable step to catch syntax errors before they are presented to the user.

### 8. Code Generation Integrity: No Placeholders
**Problem:** Using placeholders like `// ...` in code blocks results in syntactically incorrect files that break the build.
**Rule:** **NEVER use placeholders or abbreviations in code.** All code must be complete and final.

### 9. Module Management: Imports & Exports
**Problem:** Errors like `does not provide an export named '...'` or `... is not defined` have occurred multiple times.
**Rules:**
- **Verify Exports:** When creating or modifying a file, double-check that all necessary functions, types, and components are explicitly `export`ed.
- **Verify Imports:** Before finalizing a file, **first read the existing import statements**. Ensure all dependencies (hooks, components, types, **icons from `lucide-react`**, backend libraries) are correctly and **uniquely** imported. This is the most common cause of errors.
- **API Cohesion:** When modifying `lib/api.ts`, immediately perform a project-wide search for the function/type being changed and update all usages.

### 10. Core Routing Principle: Branch-First
**Problem:** Navigation links break or lead to incorrect pages after code modifications.
**Rule:** **With the exception of login/register pages, ALL authenticated routes in the admin panel MUST be prefixed with a dynamic `:branchSlug` parameter.** All navigation, links, and API calls must be constructed with the currently active branch slug.
- **Correct URL Structure:** `/:branchSlug/dashboard`, `/:branchSlug/employees`
- **Correct `NavLink`:** `<NavLink to={\`/${branchSlug}/some-path\`} ...>`
- **Incorrect:** `<NavLink to="/some-path" ...>`

### 11. UI and Performance Standards
**Problem:** Inconsistent UI elements and poor rendering performance.
**Rules:**
- **No Shadow Effects:** To maintain optimal performance, **DO NOT use `box-shadow` or similar shadow-generating CSS properties/classes (e.g., Tailwind's `shadow-md`).** Use borders for element separation.
- **Use Standardized Components:** To ensure UI consistency, **ALWAYS use the pre-built components from `@/components/ui` (e.g., `<Input>`, `<Textarea>`, `<Button>`).** NEVER use raw HTML elements like `<input>` or `<textarea>`.

### 12. React Hook Usage
**Problem:** "Maximum update depth exceeded" errors from incorrect `useEffect` dependencies.
**Rule:** Be cautious with `useEffect` dependency arrays. Avoid including objects or arrays that are recreated on every render.

### 13. Prisma Schema Modifications
**Problem:** Invalid Prisma schema files from incorrect syntax.
**Rule:** Always preserve the proper block structure for models. Never collapse a model onto a single line.

### 14. Build & Cache Troubleshooting
**Problem:** Cryptic build errors persisted even after code was corrected.
**Rule:** Escalate troubleshooting: 1. Restart server. 2. Restart with `--force`. 3. Delete `node_modules/.vite`. 4. Reinstall `node_modules`.