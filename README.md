<div align="center">
  <br/>
  <br/>
  <img width="64" height="64" alt="TheRevisionLab Logo" src="https://raw.githubusercontent.com/KeshavDaBoss/TheRevisionLab/main/public/favicon.svg" />
  <br/>
  <br/>
  <h1 align="center" style="font-size: 2.5rem; font-weight: 800; letter-spacing: -0.02em; margin: 0;">
    TheRevisionLab
  </h1>
  <p align="center" style="font-size: 1.1rem; color: #94a3b8; max-width: 500px; margin: 0.5rem auto 1.5rem;">
    A collaborative study platform for teachers and students —<br/>
    build syllabi, create quizzes, study flashcards, and share materials.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
    <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Turso_LibSQL-4F46E5?style=flat-square&logo=sqlite&logoColor=white" alt="Turso LibSQL" />
    <img src="https://img.shields.io/badge/GSAP-3-88CE02?style=flat-square&logo=greensock&logoColor=white" alt="GSAP" />
  </p>

  <br/>
</div>

---

## Overview

**TheRevisionLab** is a full-stack web application that transforms how study groups collaborate. Teachers (mentors) create workspaces, build chapter-based syllabi, write quiz questions, design flashcards, and upload study materials. Students join with a simple 6-digit code and dive straight into interactive learning — timed quizzes, untimed practice, and 3D flip-card decks.

> Built with React 19, TypeScript, Tailwind CSS 4, Vite, Express, and Turso (LibSQL).

---

## Features

### For Students
- **Join Workspaces** — Enter a 6-digit alphanumeric code to access any study room.
- **Chapter Dashboard** — Browse chapters and topics with live question/flashcard counts.
- **Quiz Module** — Multiple-choice tests with instant feedback. Choose between untimed practice or timed challenges.
- **Flashcard Decks** — Interactive 3D flip cards with shuffle, progress tracking, and smooth GSAP animations.
- **Study Materials** — View, read, and download uploaded documents (PDFs, notes, images, links, and more).

### For Mentors (Teachers)
- **Mentor Dashboard** — Password-protected admin panel for each workspace.
- **Syllabus Builder** — Create, rename, and delete chapters and topics via an interactive sidebar tree.
- **Quiz Workshop** — Build multiple-choice questions with up to 6 options, hints, and correct-answer marking.
- **Flashcard Workshop** — Create front/back study cards for any topic.
- **Material Uploader** — Publish documents (PDF, Word, PowerPoint, Excel, images, text, ZIP), lecture notes, or web links.
- **Workspace Settings** — Customize workspace name, icon, and mentor password.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, GSAP, Lucide React Icons |
| **Build** | Vite 6 |
| **Backend** | Express 4 (Node.js) |
| **Database** | Turso (LibSQL) — SQLite-compatible edge database |
| **Animations** | GSAP 3 |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
therevisionlab/
├── api/                    # Vercel serverless API entry
│   └── index.ts
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── WorkspaceLogin.tsx       # Join / Create workspace gateway
│   │   ├── StudentView.tsx          # Student dashboard & learning engines
│   │   ├── MentorView.tsx           # Mentor admin panel
│   │   ├── DocumentViewerModal.tsx  # Document preview modal
│   │   └── WorkspaceIconPicker.tsx  # Icon selector for workspaces
│   ├── data/
│   │   └── (empty — users create their own content)
│   ├── lib/
│   │   ├── api.ts                   # API client functions
│   │   ├── documentUtils.ts         # Document type helpers
│   │   └── workspaceIcons.ts        # Icon component registry
│   ├── App.tsx                      # Root app component
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Global styles & Tailwind imports
│   └── types.ts                     # TypeScript type definitions
├── server.ts                # Express + Vite dev server
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json
└── .env.example             # Environment variables template
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/KeshavDaBoss/TheRevisionLab.git
cd TheRevisionLab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TURSO_DATABASE_URL` | LibSQL database URL | `file:workspace.db` |
| `TURSO_AUTH_TOKEN` | LibSQL auth token (optional for local) | — |
| `PORT` | Server port | `3000` |

### Run Locally

```bash
# Start the development server (Express + Vite HMR)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## How It Works

1. **Create a Workspace** — A mentor creates a workspace and receives a unique 6-digit code (e.g., `7K2M9P`).
2. **Share the Code** — Students enter the code on the login page to join.
3. **Build the Syllabus** — The mentor adds chapters, topics, quiz questions, and flashcards.
4. **Upload Materials** — Mentors can upload PDFs, notes, links, and other study resources.
5. **Study & Practice** — Students explore chapters, take quizzes (timed or untimed), flip through flashcards, and view study materials.

---

---

## Deployment

The project includes a `vercel.json` configuration for easy deployment to Vercel:

```bash
npm run vercel-build
```

The API routes are handled via `api/index.ts` as Vercel serverless functions.

---


<div align="center">
  <br/>
  <p style="color: #64748b; font-size: 0.85rem;">
    Built with ❤️ by <a href="https://github.com/KeshavDaBoss">KeshavDaBoss</a>
  </p>
  <br/>
</div>