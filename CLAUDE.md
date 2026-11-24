# Job Application Tracker: project brief for Claude

## Who I am and what this is
I'm a beginner, not a professional coder. This is a school project (Project 2: Persistent Data, a database-driven web app). I've never built an API from scratch. Please explain things in plain language, keep code simple and well commented, and don't use fancy patterns I won't understand.

The app is a job application tracker for new grads and junior applicants. Users save jobs they applied to and jobs they want to apply to, and track which resume they used and whether they got a callback.

## Rules (please follow these)
- Keep downloads minimal. The only packages are `express` and `mongoose`. Ask me before adding any other package.
- Plain HTML, CSS and JavaScript for the frontend. No React, no build tools, no frameworks.
- Do not change the database schema or the existing API routes without asking me first.
- Never commit, print or edit my `.env` file. It holds my database password.
- Make small changes one step at a time. After each step, tell me what you changed, which files, and how to test it.
- Keep a short plain-language summary of what you did after each task. I need it for my process document, which has to explain my decisions and how I used AI.
- If something is unclear, ask me one short question instead of guessing.

## Tech stack
- Node.js 20 or newer, Express, Mongoose
- MongoDB Atlas (free tier) as the database
- Run locally with `npm run dev` (uses `node --env-file=.env --watch server.js`)
- Will be deployed to Vercel later. Do not change anything for deployment until I ask.

## Current project state (already working)
```
job-tracker-api/
├── server.js            starts Express, connects to MongoDB with mongoose.connect(process.env.MONGODB_URI)
├── models/
│   ├── Resume.js
│   └── Application.js
├── routes/
│   ├── resumes.js
│   └── applications.js
├── package.json
├── .env                 MONGODB_URI and PORT (secret, never touch)
└── .gitignore
```

The backend is built and tested. It connects to Atlas and the CRUD endpoints work.

### Schema (do not change)
**Resume**
| Field | Type | Required |
|---|---|---|
| name | String | yes |
| fileUrl | String | no |

**Application**
| Field | Type | Required | Notes |
|---|---|---|---|
| company | String | yes | |
| role | String | yes | |
| postingUrl | String | no | must start with http:// or https:// |
| applied | Boolean | no | default false. false = on my "want to apply" list, true = already applied |
| dateApplied | Date | no | |
| resume | ObjectId, ref Resume | no | which resume I used |
| callback | String | no | one of: none, screen, interview, offer, rejected (default none) |
| notes | String | no | |

Every record also gets `_id`, `createdAt` and `updatedAt` automatically.

### API endpoints (already exist)
- `POST /api/applications` create
- `GET /api/applications` list (optional filters: `?applied=true`, `?applied=false`, `?callback=interview`). The resume is populated with its `name` and `fileUrl`.
- `GET /api/applications/:id` read one
- `PUT /api/applications/:id` update
- `DELETE /api/applications/:id` delete
- Same five routes for `/api/resumes`

Validation errors come back as status 400 with JSON like `{ "error": "Validation failed", "details": "..." }`. Bad IDs also return 400. Missing records return 404.

## What I want you to build now
Serve a simple frontend from Express and connect it to my API. Work through these tasks one at a time and stop after each so I can test.

### Task 1: Serve the frontend from Express
- Create a `public/` folder.
- In `server.js`, serve it with `express.static('public')`.
- The current `GET /` route returns JSON and would block the web page. Move it to `GET /api/health` so `public/index.html` loads at `http://localhost:3000`.
- Because the frontend and API come from the same server, we do not need CORS.

### Task 2: Applications page
Create `public/index.html`, `public/style.css` and `public/app.js` with:
- A form to add an application: company, role, posting link, an "I've applied" checkbox, date applied, resume (a dropdown filled from `/api/resumes`), callback (dropdown with the five options), and notes.
- A list of saved applications loaded from `GET /api/applications`, showing company, role, applied or saved status, date, resume name, callback and notes.
- Tabs or buttons to filter the list: All, Applied, Want to apply.
- A way to edit an application (a form that fills with the existing values, then saves with PUT).
- A delete button with a confirmation prompt.
- A quick way to turn a "want to apply" job into an applied one.
- Show friendly error messages when the API returns 400 (for example, missing company), and an empty-state message when there are no applications.

### Task 3: Resumes section
- Add and list resumes (name and file link).
- Edit and delete resumes.
- The resume dropdown in the application form should update when resumes change.

### Task 4: Polish (only after the tasks above work)
- A clean, readable layout that works on a phone and a laptop.
- Good contrast and labels on every form field (accessibility).
- Simple, friendly styling. I'll choose colours and branding later.

## How to test each task
- Run `npm run dev`. The terminal should show "Connected to MongoDB" and "API running at http://localhost:3000".
- Open `http://localhost:3000` in the browser.
- Go through the full data lifecycle: create a record in the form, see it in the list, edit it, refresh the page to confirm it persisted, then delete it.
- Check the same data in MongoDB Atlas under Browse Collections.

## Out of scope for now
- User accounts and login (OAuth)
- File uploads (links only)
- The public board of top CVs
- Deployment (comes later)
