## 1. Product overview

The platform brings common student-organization operations into one
place.

### Planned capabilities





-   **Authentication and access control:** sign in, sign out, protected
    pages and role-based permissions.
-   **Membership:** view membership status, join/renew membership, and
    let authorized admins manage membership records.
-   **Events:** create and manage events, publish event details, and
    view registrations.
-   **Tickets and check-in:** ticket purchases/registrations, QR
    tickets, event check-in and attendance tracking.
-   **Announcements:** publish organization updates and show them to
    members.
-   **Merchandise:** product catalogue, inventory, orders and stock
    tracking.
-   **Volunteers:** volunteer opportunities, sign-ups and participation
    records.
-   **Fundraisers:** fundraiser information and contribution tracking
    where enabled.
-   **Finance:** expenses, reimbursement requests, approvals and finance
    reports.
-   **Dashboard:** show useful summaries based on the signed-in user's
    role.

The exact fields, permissions and workflows should be confirmed against
the project requirements before implementation. Do not invent additional
requirements without documenting the decision.

## 2. Technology stack

  -----------------------------------------------------------------------
  Area                                Technology
  ----------------------------------- -----------------------------------
  Frontend framework                  React + Vite

  Frontend language                   TypeScript

  Styling / components                Tailwind CSS + shadcn/ui

  Forms                               React Hook Form

  Frontend validation                 Zod

  Backend runtime                     Node.js

  Backend framework                   Express

  Backend language                    TypeScript

  Database                            PostgreSQL

  Database hosting for development    Neon (hosted PostgreSQL)

  ORM / migrations                    Prisma

  API authentication                  JWT or Better Auth --- finalize
                                      before implementing authentication

  Charts                              Recharts

  QR codes                            `qrcode`

  Payments                            Razorpay, with server-side
                                      verification

  Frontend deployment                 Vercel

  Backend deployment                  Render or Railway

  Database deployment                 Neon
  -----------------------------------------------------------------------

**Important:** The team must agree on one authentication approach before
Phase 01. Do not implement JWT manually in one branch and Better Auth in
another. Follow the Prisma major version already installed and its
documented configuration; do not mix Prisma 6 and Prisma 7 setup
instructions.

## 3. Architecture

``` text
Browser
  |
  v
React + Vite + TypeScript frontend
  |  HTTP requests (JSON; API base URL from environment)
  v
Node.js + Express + TypeScript backend
  |
  v
Prisma ORM
  |
  v
PostgreSQL database (Neon)
```

The frontend must never connect directly to PostgreSQL. Database
credentials, JWT secrets and payment secrets belong only on the backend.

### Repository layout

For a single Git repository, a suggested layout is:

``` text
student-organization-system/
├── frontend/                 # React + Vite app
├── backend/                  # Express API
├── docs/
│   ├── API_CONTRACT.md        # agreed API routes and payloads
│   ├── DATABASE_DESIGN.md    # schema notes and relationships
│   └── TEAM_WORKFLOW.md      # decisions and collaboration rules
├── README.md
└── .gitignore
```

If the repository already uses separate frontend and backend
repositories, keep them separate and copy this README into both
repositories or link to the shared project documentation. Do not create
nested `frontend/frontend` or `backend/backend` directories.

## 4. Team responsibilities

There are four developers: two frontend and two backend.
Responsibilities identify ownership, not permission to work in
isolation. Everyone should understand the full product and agreed API
contract.

### Frontend Developer 1 --- foundation and shared UI

Owns: - React/Vite/TypeScript setup and frontend scripts. - Tailwind CSS
and shadcn/ui setup. - App routing, shared layout, navigation and
responsive shell. - Shared design tokens, reusable UI components and
common states. - API client configuration and environment variable
handling. - Authentication screens and protected-route integration when
Phase 01 begins. - Frontend README/setup instructions and
build/type-check fixes.

### Frontend Developer 2 --- feature screens and user workflows

Owns: - Feature page structure and navigation entries. - Membership and
event screens. - Ticket/QR/check-in screens. - Announcements and
merchandise screens. - Volunteer, fundraiser and finance screens. -
Forms, tables, filters, empty/loading/error states and responsive
behavior. - Connecting pages to the real API when endpoints are agreed
and available.

Do not build a separate mock API or hardcode fake data inside production
screens. If mocks are needed, isolate and label them so they can be
removed easily.

### Backend Developer 1 --- foundation, database and core API

Owns: - Express/TypeScript setup, configuration and common middleware. -
Prisma setup, database connection and migrations. - Authoritative
initial Prisma schema and documented schema changes. - User model, roles
and authentication foundation once approved. - Membership and event API
foundations. - Common API response/error conventions, health endpoints
and backend documentation.

### Backend Developer 2 --- domain APIs and integrations

Owns: - Ticketing, ticket state and event check-in APIs. - Payment order
creation and server-side payment verification. - Merchandise,
stock/inventory and order APIs. - Announcements, volunteers and
fundraisers. - Expense/reimbursement workflows and finance summaries. -
Tests for domain rules, authorization and transaction safety.

**Shared ownership rules** - Backend Developer 1 owns the authoritative
Prisma schema initially. Backend Developer 2 must discuss schema changes
before editing the same file. - Do not have multiple people
independently edit the same shared file and then overwrite each other's
work. - Frontend developers should agree on shared routing, component
names and API client conventions before parallel feature work. - Every
feature must be integrated and reviewed; "works on my laptop" is not the
completion criterion.

## 5. Development phases and completion gates

Each phase should have a branch or clearly identified pull request, a
short summary, test results and a review. A phase is complete only when
its acceptance criteria are met.

### Phase 00 --- foundation and architecture

**Frontend** - React/Vite/TypeScript project runs. - Tailwind and
shadcn/ui are configured. - Shared layout, routing and API client
conventions are established. - Environment example and setup
documentation exist. - Type-check/build pass.

**Backend** - Express/TypeScript project runs. - Environment variables
are validated. - CORS, central error handling and not-found handling are
configured. - Health endpoint works; readiness endpoint checks the
actual database connection. - Prisma schema validates and client
generation succeeds. - Neon connection and initial migration are
verified when credentials are configured. - `.env.example` exists and
secrets are excluded from Git.

**Gate:** both apps run locally; build/type-check and backend checks
pass; all four developers can follow setup instructions.

### Phase 01 --- authentication and app shell

-   Finalize JWT vs Better Auth and document the decision.
-   Implement registration/sign-in/sign-out as required by the agreed
    requirements.
-   Hash passwords securely if handling passwords directly; never store
    plaintext passwords.
-   Add authorization middleware and role-protected APIs/pages.
-   Define roles and permissions explicitly.
-   Connect the frontend auth flow to the backend.
-   Test invalid credentials, expired/invalid sessions and unauthorized
    access.

**Gate:** authentication and role restrictions are verified in both API
tests and UI flows.

### Phase 02 --- membership and events

-   Membership status, join/renewal flow and admin membership views.
-   Event creation/editing/publishing and event listing/details.
-   Validate request bodies on the server with Zod.
-   Enforce role/ownership rules in backend routes.
-   Add loading, empty, success and error states in the UI.

**Gate:** authorized users can complete agreed membership and event
workflows against the real database.

### Phase 03 --- tickets, payments and check-in

-   Registration/ticket records and ticket states.
-   Razorpay order creation on the backend, if payments are in scope.
-   Verify payment signatures/status on the server; never trust a
    frontend "payment successful" message.
-   Store only necessary payment references, not card details.
-   Generate QR codes and validate ticket/check-in status server-side.
-   Prevent duplicate check-ins and unsafe duplicate payment processing.
-   Use database transactions where multiple records must change
    together.

**Gate:** test payment success/failure and duplicate requests in
sandbox/test mode; validate check-in rules.

### Phase 04 --- merchandise and announcements

-   Merchandise catalogue and inventory management.
-   Order creation and stock consistency.
-   Announcement creation/publishing and member-facing list/detail
    views.
-   Validate permissions and prevent overselling through appropriate
    transaction/locking strategy.

**Gate:** authorized admins can manage products and announcements;
member workflows use real APIs.

### Phase 05 --- volunteers, fundraisers and finance

-   Volunteer opportunities, sign-ups and participation records.
-   Fundraiser pages and contribution records as specified.
-   Expense and reimbursement submission, review and status tracking.
-   Finance summaries/reports based on stored records.
-   Validate amounts, currencies, statuses and permissions on the
    server.
-   Keep an audit trail for sensitive financial status changes where
    required.

**Gate:** finance totals reconcile with underlying records and
unauthorized users cannot access restricted financial data.

### Phase 06 --- integration, testing and security

-   Integrate all feature branches.
-   Test complete user journeys, not just isolated components.
-   Check validation, authorization, database constraints and failure
    handling.
-   Test responsive layouts and accessibility basics.
-   Check duplicate submissions, inventory consistency and
    payment/check-in edge cases.
-   Remove accidental mock data, debug secrets and unused code.
-   Review logs so they do not expose passwords, tokens or secrets.

**Gate:** all critical workflows pass; no known blocker remains; README
and environment examples are current.

### Phase 07 --- deployment and presentation

-   Deploy frontend to Vercel.
-   Deploy backend to Render or Railway.
-   Use Neon PostgreSQL for the hosted database.
-   Configure production environment variables in hosting dashboards.
-   Configure CORS to allow only the intended frontend origins.
-   Run migrations using the agreed production-safe process.
-   Test the deployed application end-to-end.
-   Prepare demo accounts/data without exposing real user information.
-   Prepare architecture diagram, ER diagram, feature demo and
    known-limitations list.

**Gate:** deployed application is accessible and critical workflows have
been tested in the deployed environment.

## 6. Database setup without installing PostgreSQL locally

The team can use a shared **Neon PostgreSQL** database. Each developer
only needs Node.js and internet access; a local PostgreSQL server is not
required.

1.  One designated team member creates the Neon project and database.
2.  Save the connection string privately.
3.  Put the connection string in the backend developer's local `.env`
    file.
4.  Each teammate gets their own local `.env` file if they need to run
    the backend.
5.  Share credentials only through a trusted private channel or a proper
    secrets manager. Never commit credentials to Git or paste them into
    public issues.
6.  Use the same development database only with team agreement.
    Coordinate migrations and avoid destructive commands.
7.  For safer isolation, create separate Neon branches/databases for
    experiments when available and practical.

Example backend `.env` (adapt variable names to the generated project
and installed Prisma version):

``` dotenv
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL="YOUR_PRIVATE_NEON_CONNECTION_STRING"
```

Create a local `.env` file; do not replace the placeholder in
`.env.example` with a real secret.

**Database safety** - Never run `prisma migrate reset` against a shared
database. - Do not delete or recreate tables to fix a migration error. -
Do not use `db push` as a casual substitute for the project's migration
workflow. - Before applying a migration, communicate what changes it
makes and review the migration file. - Keep seed data fictional and safe
to reset only in an explicitly disposable development database.

## 7. Setup on each developer's laptop

### Prerequisites

-   Git
-   Node.js LTS and npm
-   Code editor (for example, VS Code)
-   Internet connection
-   Repository access
-   Backend `.env` values if running the API locally

Check installation:

``` bash
node -v
npm -v
git --version
```

### Clone the project

``` bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_FOLDER>
```

Do not run `git clone` inside an existing cloned repository.

### Frontend setup

``` bash
cd frontend
npm install
```

Create `frontend/.env.local` using the variable expected by the API
client. For example:

``` dotenv
VITE_API_URL=http://localhost:5000/api
```

Only public frontend configuration belongs in variables prefixed with
`VITE_`. **Never put database URLs, JWT signing secrets, Razorpay secret
keys or other private credentials in frontend environment variables.**

Run the frontend:

``` bash
npm run dev
```

Use the local URL printed by Vite, commonly `http://localhost:5173`.

### Backend setup

In a separate terminal:

``` bash
cd backend
npm install
```

Create `backend/.env` with the agreed values and private Neon connection
string. Then run the commands documented by the generated backend
project. Typical commands may include:

``` bash
npm run dev
```

Prisma commands depend on the installed version and project scripts. Use
the backend README and package scripts as the source of truth; do not
blindly run commands copied from a different Prisma major version.

### Verify the setup

-   Frontend opens in the browser.
-   Backend health endpoint responds at the documented local URL.
-   Backend readiness check reports database connectivity only after a
    real database query succeeds.
-   No secrets are visible in browser code, Git status or logs.
-   Type-check/build and tests pass according to the repository scripts.

If a command fails, copy the full error message and the command you ran.
Remove passwords, connection strings, access tokens and other secrets
before sharing logs.

## 8. Git and collaboration workflow

Use feature branches. Avoid committing directly to `main`.

Suggested branch names:

``` text
feat/frontend-foundation
feat/frontend-membership-events
feat/backend-foundation
feat/backend-membership-events
fix/ticket-duplicate-checkin
docs/api-contract
```

Typical workflow:

``` bash
git checkout main
git pull
git checkout -b feat/short-feature-name

# Make a focused change and run relevant checks.
git status
git add <specific-files>
git commit -m "feat: describe the change"
git push -u origin feat/short-feature-name
```

Open a pull request and request review before merging. If your branch is
behind `main`, sync it using the team's agreed process. Do not
force-push shared branches or overwrite another person's work.

### Before every commit

-   Check `git status`.
-   Confirm `.env`, `.env.local`, build output, `node_modules` and
    private keys are not staged.
-   Run relevant tests/type-check/build.
-   Keep the commit focused and explain what changed.
-   Update docs if API routes, environment variables, schema or setup
    instructions changed.

### Coordination routine

At the start of a work session, each developer should state: 1. The
feature/phase being worked on. 2. The files likely to change. 3. API
endpoints or schema changes needed. 4. Dependencies/blockers.

Before changing a shared file, tell the team. Agree on API
request/response shapes before frontend and backend implement the same
feature in parallel.

## 9. API conventions

The backend should document the final routes and schemas in
`docs/API_CONTRACT.md`. This section defines defaults until the team
agrees otherwise.

-   Prefix API routes with `/api`.
-   Use JSON for normal request and response bodies.
-   Use HTTP status codes accurately.
-   Validate all incoming data on the server.
-   Keep response shapes consistent.
-   Do not return password hashes, secrets or internal stack traces.
-   Require authentication and authorization for protected operations.
-   Enforce authorization on the backend; hiding a button in the UI is
    not security.
-   Use pagination for potentially large lists.
-   Store timestamps consistently and display them in the intended local
    timezone.
-   Use database constraints and transactions for operations that must
    remain consistent.

Suggested error response shape (example only; align implementation and
docs):

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields",
    "details": []
  }
}
```

Suggested health routes:

``` text
GET /api/health         # process/liveness check
GET /api/health/ready   # readiness check including actual database connectivity
```

Do not report database readiness as successful when the database query
failed.

## 10. Security and secrets

Never commit or share publicly: - `.env` files or real database
connection strings. - JWT signing secrets or session secrets. - Razorpay
secret keys or other private API credentials. - Passwords, access tokens
or production user data.

The repository should have a `.gitignore` that excludes at least `.env`,
`.env.*` (while allowing `.env.example`), `node_modules`, build outputs,
coverage outputs and local logs. Verify the exact rules work for your
repository.

Additional rules: - Hash passwords with a suitable password-hashing
library if the application manages passwords itself. - Keep
authorization checks on the server. - Verify payments server-side. - Do
not trust prices, totals, roles or payment status supplied by the
browser. - Validate uploaded files and limit request sizes if uploads
are added. - Use HTTPS in production. - Do not log credentials, payment
secrets, full tokens or sensitive personal information.

## 11. Definition of done for any feature

A feature is not done merely because its page renders. Check all that
apply:

-   [ ] Requirements and role permissions are understood.
-   [ ] API contract and database impact are agreed.
-   [ ] Frontend handles loading, empty, success and error states.
-   [ ] Server validates input and enforces authorization.
-   [ ] Database changes use reviewed migrations.
-   [ ] Relevant tests pass.
-   [ ] Type-check/build passes.
-   [ ] No private credentials or real sensitive data are committed.
-   [ ] Responsive behavior is checked where applicable.
-   [ ] Documentation is updated.
-   [ ] Another team member has reviewed the change.

## 12. Decisions to record

Keep these decisions in `docs/TEAM_WORKFLOW.md` or project issues:

-   Repository structure: monorepo or separate repositories.
-   Final auth choice: JWT implementation or Better Auth.
-   Role/permission matrix.
-   Prisma version and migration workflow.
-   API response/error format.
-   Shared development database strategy.
-   Payment currency, test mode and refund requirements if applicable.
-   Who can approve memberships, expenses and reimbursements.
-   Production environment variable names and deployment owner.

Do not guess these decisions in separate branches. Agree once and
document the result.

## 13. Helpful commands

Run commands from the relevant `frontend` or `backend` directory.

``` bash
npm install       # install dependencies
npm run dev       # run local development server, if configured
npm run build     # production build, if configured
npm run lint      # lint, if configured
npm run test      # tests, if configured
```

Available scripts depend on each package's `package.json`. Check
`npm run` to list scripts. Do not claim a check passed unless it was
actually run.

------------------------------------------------------------------------

## First team checklist

-   [ ] Create/confirm the shared Git repository and add all four
    members.
-   [ ] Add this README and agree on the folder structure.
-   [ ] Create a Neon development database and share credentials
    privately.
-   [ ] Assign one owner for initial Prisma schema and migrations.
-   [ ] Agree on authentication choice before Phase 01.
-   [ ] Finish Phase 00 and verify setup on all four laptops.
-   [ ] Review and approve the phase before starting the next one.