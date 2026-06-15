# ⚡ SkillPilot AI

> AI-powered resume analyzer & ATS optimizer — score your resume, match job descriptions, track improvement over time.

![SkillPilot AI](https://img.shields.io/badge/SkillPilot-AI%20Resume%20Analyzer-blue?style=for-the-badge&logo=lightning)

---

## 🚀 Features

- **ATS Score** — Instant resume scoring against ATS criteria
- **JD Match** — Match your resume against any job description with AI gap analysis
- **Score Trend** — Track improvement across every resume version (last 5 shown)
- **Version History** — Side-by-side comparison of all resume versions
- **Profile Management** — Edit name, email, change password
- **Auth System** — Login, register, forgot/reset password with email codes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS + GSAP animations |
| Backend | FastAPI (Python) |
| Database | SQLite (via SQLAlchemy) |
| PDF Parsing | pypdf |
| Auth | JWT-style token + localStorage |

---

## 📁 Project Structure

```
SkillPilot-AI/
├── backend/
│   ├── main.py           # FastAPI app + all API routes
│   ├── database.py       # SQLAlchemy models + DB setup
│   ├── parser_core.py    # Resume parsing + ATS scoring logic
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Environment variable template
└── frontend/
    ├── src/
    │   ├── components/   # All React components
    │   ├── hooks/        # useAuth hook
    │   ├── App.jsx       # Main app + routing
    │   └── index.css     # Global styles + design system
    ├── index.html
    └── vite.config.js
```

---

## ⚙️ Local Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Fill in GMAIL_USER and GMAIL_APP_PASSWORD

uvicorn main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Variables

Create `backend/.env` from `backend/.env.example`:

| Variable | Description |
|---|---|
| `GMAIL_USER` | Gmail address to send password reset emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (from Google Account settings) |

---

## 🌐 Deployment

- **Frontend** → [Vercel](https://vercel.com) (set root to `frontend/`)
- **Backend** → [Render](https://render.com) (Python web service, set root to `backend/`)

Set environment variables (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) in your deployment platform's dashboard.

---

## 📄 License

MIT © SkillPilot AI
