# Jobs

A job application tracker. Paste a job description, and Claude extracts the
fields — title, category, company, address, pay, full/part-time — and looks up
the store's real street address on the web.

Vanilla HTML/CSS/JS, no build step, no dependencies. Same shape as
[Systems](https://github.com/rasoulisaeid/systems): a `localStorage` cache
mirrored to Firebase Realtime Database over plain REST.

## Run it

- **Online:** it's a static site — GitHub Pages with zero config
  (Settings → Pages → deploy from `main` / root).
- **Locally:**
  ```bash
  npx serve .        # or: python -m http.server
  ```
  Open `http://localhost:3000`. Don't use `file://` — the Claude API call needs
  a real origin.

## First run

No login, no password — open it and the jobs are there.

1. **Settings → Claude API key.** Get one at
   [console.anthropic.com](https://console.anthropic.com/settings/keys). This is
   stored per-browser, so it has to be entered once on each device.
2. **Settings → Import JSON** if you have an export to bring in.

## Using it

**Add job** → paste the description → **Extract with Claude** (or `Ctrl+Enter`)
→ paste the link → check the fields → **Save job**.

Column headers sort. Search matches title, company, address, category, and the
saved description. Addresses open Google Maps in a new tab.

### Addresses

Postings rarely print a street address. With **Address lookup** on (the default),
Claude searches the web for the exact address of the specific store or branch the
posting names. A looked-up address is Claude's reading of search results, not a
fact from the posting — when one is used the modal says so in red, so **check it
before saving**. If an employer has several locations in a city and the posting
doesn't say which, Claude falls back to `City, ST` rather than guessing.

### Apply

Every row has an **Apply** button that opens `apply.html?job=<id>`: the role at
the top, the resume underneath, rendered as it will look rather than as LaTeX.

**Tailor for this job** sends the posting and the resume to Claude — pinned to
Opus 5 at high effort, since this runs once per application and a recruiter
reads the result. It comes back re-worded and re-ordered for that posting, with
a list of what it changed so the work can be checked. It is instructed never to
invent an employer, date, skill or qualification; if the posting wants something
she doesn't have, it says so in the change list instead of papering over it.
Read it before saving — it is a language model writing a factual document.

**Save as version** keeps a copy against that job. **Print / Save as PDF** is the
quickest route to an attachment; **Overleaf** typesets the real LaTeX (and
uploads the resume to a third party to do it). `Edit the LaTeX source` opens the
source if it needs a hand edit.

### Interview prep

The graduation-cap icon opens a study page for jewelry sales associate
interviews: 25 likely questions with sample answers in plain English, a 4Cs and
metals cheat sheet, and questions to ask the interviewer. Tick a question once
you can answer it without reading. Progress is stored per-browser; `Ctrl+P`
prints everything expanded.

## How data is stored

```
browser  ──►  localStorage  ──mirror──►  Firebase RTDB /jobs/rasoulisaeid
```

| Key | Contents | Synced |
| --- | --- | --- |
| `jobs:v1:jobs` | every job record, including the pasted description | yes |
| `jobs:v1:categories` | your category list | yes |
| `jobs:v1:prefs` | model, thinking effort, address-lookup toggle | yes |
| `jobs:local:apiKey` | the Claude API key | **no — this device only** |
| `jobs:local:resume` | the resume LaTeX | **no — this device only** |
| `jobs:local:resumeVersions` | resumes tailored per job | **no — this device only** |

The Firebase node is readable without auth. Job postings are public listings, so
they go up as-is. Two things must not, so they are kept outside the synced
namespace entirely — `Store.dump()` never sees them and an incoming sync never
overwrites them:

- **The API key.** Self-explanatory.
- **The resume.** It carries a home city, a phone number and a personal email,
  and this repo is public *including the database URL in `js/sync.js`* — anyone
  reading the repo could fetch the node.

The cost is that neither follows her to a second device; both are entered once
per browser. `js/resume.js` ships the resume with the contact line placeheld
(`CITY, STATE ZIP` / `PHONE NUMBER` / `EMAIL ADDRESS`) for the same reason, and
the app nags until they're replaced. The filled-in `resume.tex` is gitignored.

Changes sync live between devices over SSE; edits made offline are saved locally
and pushed when the connection returns. The dot in the top bar is grey offline,
red on a sync error.

**Back up with Settings → Export JSON.** That file is plaintext — keep it off
the repo (it's gitignored) and off shared drives.

### About the API key

There is no server in this app, so the browser calls Anthropic directly. That
requires the `anthropic-dangerous-direct-browser-access` header, and it means the
key sits in `localStorage` on whichever device you typed it into. It never
syncs and never reaches the repo. If that tradeoff stops being acceptable, move
extraction behind a small proxy (a Cloudflare Worker is ~30 lines) and drop the
key from the browser entirely.

## Structure

```
index.html          jobs dashboard + modals
apply.html          one job + the resume for it
interview.html      interview prep page
css/style.css       theme + shell (matches Systems)
css/apply.css       apply page + the rendered "paper"
css/interview.css   interview page styles
js/store.js         namespaced localStorage cache
js/sync.js          Firebase RTDB mirror (REST + SSE)
js/ui.js            el() / clear() DOM helpers
js/data.js          jobs model
js/extract.js       Claude API call + extraction schema
js/resume.js        resume + versions (device-local)
js/latex-render.js  the LaTeX subset -> HTML preview
js/tailor.js        resume tailoring (Opus 5, high effort)
js/app.js           dashboard wiring
js/apply.js         apply page wiring
js/interview.js     interview page logic

tools/import-to-firebase.mjs   one-shot bulk import of an export file
```
