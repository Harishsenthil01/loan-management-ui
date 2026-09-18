# Loan Management System — Frontend

A complete, responsive frontend for a banking/loan management application, built with **React 19 + TypeScript + Vite + Tailwind CSS v4**.

## ⚠️ Important: API contract assumptions

No backend source code was available to inspect when this was built, so the API endpoints below are **assumptions** based on standard REST conventions and the entity fields in the project brief — not confirmed against real controllers. Before connecting to your actual Spring Boot backend, check each endpoint below against your real `@RequestMapping`s and adjust the relevant file in `src/services/`. Nothing else needs to change — all HTTP calls are isolated to that folder.

| Feature | Assumed endpoint | Service file |
|---|---|---|
| Register | `POST /users` | `auth.service.ts` |
| Login | `POST /users/login` | `auth.service.ts` |
| Update profile | `PUT /users/{id}` | `auth.service.ts` |
| List/CRUD customers | `/customers`, `/customers/{id}` | `customer.service.ts` |
| List/CRUD loan applications | `/loan-applications`, `/loan-applications/{id}` | `loan-application.service.ts` |
| Update loan status | `PATCH /loan-applications/{id}/status` | `loan-application.service.ts` |
| Loan details | `/loan-applications/{id}/loan-details` | `loan-details.service.ts` |
| List/upload documents | `/loan-applications/{id}/documents`, `POST /documents` (multipart), `GET /documents` | `loan-document.service.ts` |
| Dashboard summary | `GET /dashboard/summary` (not confirmed to exist — wire up or remove) | `dashboard.service.ts` |

The backend currently has **no JWT** based on the entity definitions given (`User` has no token field). The auth flow tolerates either a bare `User` response or `{ user, token }` from `/users/login` — once JWT is added server-side, no other file needs to change.

## Getting started

```bash
npm install
cp .env.example .env   # then edit VITE_API_BASE_URL to point at your backend
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
 ├── components/
 │    ├── common/       # Button, Input, Select, Badge, Card, ConfirmDialog, Pagination, etc.
 │    ├── layout/        # Header, Sidebar, MainLayout (responsive app shell)
 │    ├── customers/     # CustomerForm (shared by Add/Edit)
 │    └── documents/     # DocumentsPanel (embedded in loan application details)
 ├── pages/
 │    ├── auth/          # Login, Register
 │    ├── customers/     # List, Add, Edit, Details
 │    ├── loans/          # List, multi-step Create, Edit, Details, Loan Details form
 │    ├── documents/      # List, Upload, Details
 │    ├── Dashboard.tsx
 │    └── Profile.tsx
 ├── services/            # One file per backend resource — the ONLY place HTTP calls live
 ├── models/              # TypeScript interfaces mirroring backend entities/DTOs
 ├── guards/              # ProtectedRoute + reusable permission system (Can, usePermission)
 ├── context/             # AuthContext, ToastContext
 └── utils/               # useForm hook, validators, formatters, session storage
```

## Key design decisions

- **No hard-coded role checks in components.** Role → permission mapping lives in `guards/permissions.ts`; components use `<Can do="customer:manage">…</Can>` or `usePermission()`. Add a new role or capability in one place.
- **No plaintext passwords in storage.** The session utility only ever persists the authenticated user's public profile and (once available) a bearer token — never the password.
- **Centralized error handling.** The Axios response interceptor in `services/api.ts` maps every backend/network error to a friendly message and a typed `AppError`; a 401 automatically clears the session and redirects to `/login`.
- **Consistent form UX.** Every form (register, login, customer, loan application, loan details, document upload, profile) shares the same `useForm` hook, so validation, touched-state, and error display behave identically everywhere.
- **Environment-based API URL.** Set once in `.env` via `VITE_API_BASE_URL` — never hard-coded in source.
- **Protected routing.** `/dashboard`, `/customers`, `/loans`, `/documents`, `/profile` all require authentication via `ProtectedRoute`; unauthenticated visits redirect to `/login` and return the user to their original destination after signing in.

## What to do next

1. Confirm the real backend endpoints, request/response DTOs, and error shapes, then adjust `src/services/*.ts` accordingly.
2. If the backend doesn't yet expose a dashboard-summary endpoint, either implement one or replace `DashboardService.getSummary()` with client-side aggregation over the applications/customers lists.
3. Wire up JWT once available — only `auth.service.ts` and `utils/session.ts` need touching.
