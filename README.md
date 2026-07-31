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

**Cover letter** is the other tab on the same page. Claude drafts it from the
posting and the current resume — three paragraphs, short sentences, ordinary
words, and a long list of things it must not sound like ("I am writing to
express my interest", "leverage", "passionate about", rhetorical em dashes,
flattery that would fit any company). She has to sound like this letter in the
interview, so it is written to be sayable. It gets its own versions, editing and
PDF, and refuses to run without a job to be addressed to.

Both tabs share one pipeline: the same LaTeX, renderer, inline editing,
autosave, versions and print path. **Only do what I asked** switches either one
from a rewrite to a targeted edit, and the result reports how many lines
actually moved.

Each result is saved as a version against that job (`v1`, `v2`, …) and syncs, so
re-opening the page picks up the newest and the next tailoring builds on it
rather than starting from the default. **Save as version** snapshots a manual
edit. **Print / Save as PDF** is the quickest route to an attachment;
**Overleaf** typesets the real LaTeX (and uploads the resume to a third party to
do it). `Edit the LaTeX source` opens the source if it needs a hand edit.

### Interview

The microphone icon opens `mock.html?job=<id>`: one interview, researched and
written for that specific job. Claude gets the posting, the tailored resume and
the cover letter, then **searches the web for what candidates report being asked
at that company** — Glassdoor, Indeed, write-ups — and produces 15 questions in
six sections, from the greeting through to the close.

A question is badged **Reported at this company** only when a source actually
attributes it to that employer; anything Claude wrote itself stays unbadged. The
sources it used are linked at the top, so the claim is checkable. If it found
nothing about the company it says so rather than dressing up generic questions.

Every question carries an answer in her own words, built only from her resume
and letter, plus a line on what the interviewer is really checking. The whole
sheet is on one page — it is a study sheet, not a simulation — and prints.

**ElevenLabs** reads any question aloud, purely to get used to hearing them in
different accents. Add voice IDs on the page (ElevenLabs → Voices → copy the
Voice ID) and switch between them; the API key goes in **Settings** on the jobs
page. Voice IDs sync — they are not secret. The key does not.

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
| `jobs:v1:resume` | the resume LaTeX, contact line placeheld | yes |
| `jobs:v1:resumeVersions` | resumes tailored per job | yes |
| `jobs:v1:coverBase` | the blank cover letter | yes |
| `jobs:v1:coverVersions` | cover letters written per job | yes |
| `jobs:v1:voices` | ElevenLabs voice IDs (not secret) | yes |
| `jobs:local:apiKey` | the Claude API key | **no — this device only** |
| `jobs:local:elevenKey` | the ElevenLabs API key | **no — this device only** |
| `jobs:local:contact` | real address, phone, email | **no — this device only** |

The Firebase node is readable without auth, and this repo is public *including
the database URL in `js/sync.js`* — so anyone reading the repo could fetch it.
Job postings are public listings and go up as-is. The resume does too, but only
because of the split that makes it safe:

```
Store  resume / resumeVersions  ->  LaTeX with CITY, STATE ZIP · PHONE NUMBER · EMAIL ADDRESS
local  jobs:local:contact       ->  the real address, phone and email
```

The placeholders are only filled in on the way *out* — preview, print, download,
copy, Overleaf — by `applyContact()`. `redact()` is the inverse and runs on
everything heading into `Store`, so typing the real details straight into the
LaTeX source still cannot publish them. A useful side effect: the copy sent to
Claude for tailoring is the placeholder one, so no contact detail is in that
request either.

What does sync is her name, work history and education — public-CV material.
The API key and the contact details never leave the browser they were typed
into, which means both are entered once per device. The filled-in `resume.tex`
is gitignored.

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
mock.html           spoken mock interview
interview.html      interview prep page
css/style.css       theme + shell (matches Systems)
css/apply.css       apply page + the rendered "paper"
css/interview.css   interview page styles
js/store.js         namespaced localStorage cache
js/sync.js          Firebase RTDB mirror (REST + SSE)
js/ui.js            el() / clear() DOM helpers
js/data.js          jobs model
js/extract.js       Claude API call + extraction schema
js/resume.js        resume + versions
js/cover.js         cover letters, same API so apply.js shares one path
js/latex-render.js  LaTeX subset -> HTML, with source offsets for inline editing
js/tailor.js        tailoring + letter writing (Opus 5, high effort)
js/voice.js         ElevenLabs text-to-speech + the voice list
js/interviews.js    per-job interview: web research + storage
js/app.js           dashboard wiring
js/apply.js         apply page wiring
js/mock.js          interview page logic
js/interview.js     interview page logic

tools/import-to-firebase.mjs   one-shot bulk import of an export file
```
