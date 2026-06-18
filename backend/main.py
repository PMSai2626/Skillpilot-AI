import os
import io
import re
import json
import hashlib
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import init_db, SessionLocal, User, Resume, Analysis, Version
from parser_core import parse_and_score, load_role_profiles, extract_skills

# Load environment variables from .env file
load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Resume Analysis Backend", version="1.0.0")

# CORS Setup to allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup database initialization
@app.on_event("startup")
def on_startup():
    init_db()

# DB Session Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Secure password hashing (built-in SHA256 helper)
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ----------------- REQUEST MODELS (Required for FastAPI 0.136+ / Pydantic v2) -----------------

class RegisterPayload(BaseModel):
    name: str
    email: str
    password: str

class LoginPayload(BaseModel):
    email: str
    password: str

class SuggestionPayload(BaseModel):
    suggestionId: Optional[str] = None
    customText: Optional[str] = None

class ForgotPasswordPayload(BaseModel):
    email: str

class ResetPasswordPayload(BaseModel):
    email: str
    code: str
    newPassword: str

class CareerGapPayload(BaseModel):
    roleId: str
    currentSkills: Optional[list[str]] = None   # manual input; if absent → pull from DB
    userId: Optional[int] = None                 # if provided → fetch latest resume skills

class UpdateProfilePayload(BaseModel):
    name: str
    email: str

class ChangePasswordPayload(BaseModel):
    currentPassword: str
    newPassword: str

# ----------------- AUTHENTICATION ROUTES -----------------

@app.post("/api/auth/register")
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    name = payload.name.strip() if payload.name else ""
    email = payload.email.strip().lower() if payload.email else ""
    password = payload.password
    
    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Missing required registration fields")
        
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already registered")
        
    new_user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }

@app.post("/api/auth/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    email = payload.email.strip().lower() if payload.email else ""
    password = payload.password
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="No account found with this email address.")
    if user.password_hash != hash_password(password):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
        
    # Standard dummy JWT simulation token containing user ID
    token = f"simulated-jwt-token-for-user-{user.id}"
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

import random
from datetime import datetime, timedelta

# ─── Email Helper ─────────────────────────────────────────────────────────────
def send_reset_email(to_email: str, code: str) -> bool:
    """Send a password-reset code via Gmail SMTP. Returns True on success."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD or GMAIL_USER == "your_gmail_address@gmail.com" or GMAIL_APP_PASSWORD == "your_16_character_app_password":
        logger.warning(
            f"Email not configured. PASSWORD RESET CODE for {to_email}: {code}  "
            "(Set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env to enable real emails.)"
        )
        return False

    subject = "AI Resume Analyzer — Password Reset Code"
    html_body = f"""\
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 2rem;
                background: #0a0f1e; border-radius: 12px; color: #f8fafc;">
      <h2 style="color: #00dfd8; margin-bottom: 0.5rem;">Password Reset Request</h2>
      <p style="color: #94a3b8; margin-bottom: 1.5rem;">
        We received a request to reset the password for your AI Resume Analyzer account.
      </p>
      <div style="background: #12182b; border: 1px solid rgba(0,223,216,0.25);
                  border-radius: 10px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
        <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.5rem;">
          Your verification code (valid for 10 minutes)
        </p>
        <span style="font-size: 2.2rem; font-weight: 700; letter-spacing: 0.25em;
                     color: #00dfd8; font-family: monospace;">{code}</span>
      </div>
      <p style="color: #64748b; font-size: 0.82rem;">
        If you did not request this, you can safely ignore this email.
        Your password will not be changed.
      </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"AI Resume Analyzer <{GMAIL_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())
        logger.info(f"Reset email sent to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("Gmail SMTP authentication failed. Check GMAIL_USER and GMAIL_APP_PASSWORD in .env")
        return False
    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")
        return False


@app.post("/api/auth/forgot-password")
def forgot_password(payload: ForgotPasswordPayload, db: Session = Depends(get_db)):
    email = payload.email.strip().lower() if payload.email else ""
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    # Generate 6-digit random code
    code = f"{random.randint(100000, 999999)}"
    user.reset_code = code
    user.reset_code_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    email_sent = send_reset_email(email, code)

    response: dict = {
        "success": True,
        "emailSent": email_sent,
        "message": (
            f"A verification code has been sent to {email}. Please check your inbox."
            if email_sent
            else "Email is not configured. Use the verification code shown below to reset your password."
        ),
    }

    # When email isn't configured, surface the code in the response so the
    # frontend can display it directly to the user (dev / local mode).
    if not email_sent:
        response["devCode"] = code

    return response

@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordPayload, db: Session = Depends(get_db)):
    email = payload.email.strip().lower() if payload.email else ""
    code = payload.code.strip() if payload.code else ""
    new_password = payload.newPassword
    
    if not email or not code or not new_password:
        raise HTTPException(status_code=400, detail="Missing required reset fields")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.reset_code or user.reset_code != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    if not user.reset_code_expires or user.reset_code_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired")
        
    user.password_hash = hash_password(new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()
    
    return {
        "success": True,
        "message": "Password has been reset successfully. You can now log in."
    }

# ----------------- USER PROFILE ENDPOINTS -----------------

@app.put("/api/users/{userId}/profile")
def update_profile(userId: int, payload: UpdateProfilePayload, db: Session = Depends(get_db)):
    """Update a user's display name and email address."""
    user = db.query(User).filter(User.id == userId).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    new_name  = payload.name.strip()
    new_email = payload.email.strip().lower()

    if not new_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
    if not new_email:
        raise HTTPException(status_code=400, detail="Email cannot be empty.")

    # Check email uniqueness (only if it actually changed)
    if new_email != user.email:
        existing = db.query(User).filter(User.email == new_email, User.id != userId).first()
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user.name  = new_name
    user.email = new_email
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "user": {
            "id":    user.id,
            "name":  user.name,
            "email": user.email,
            "role":  user.role,
        }
    }


@app.put("/api/users/{userId}/password")
def change_password(userId: int, payload: ChangePasswordPayload, db: Session = Depends(get_db)):
    """Change a user's password after verifying the current one."""
    user = db.query(User).filter(User.id == userId).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.password_hash != hash_password(payload.currentPassword):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")

    if len(payload.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    user.password_hash = hash_password(payload.newPassword)
    db.commit()

    return {"success": True, "message": "Password changed successfully."}


# ----------------- JD MATCH ENDPOINT -----------------

@app.post("/api/resumes/match-jd")
async def match_jd(
    job_description: str = Form(...),
    resume_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Compare a resume (file or plain text) against a job description.
    Returns match score, found skills, missing skills, and keyword coverage.
    """
    # ── 1. Resolve resume text ────────────────────────────────────────────────
    raw_resume = ""

    if file and file.filename:
        content_bytes = await file.read()
        filename = file.filename.lower()

        if filename.endswith(".pdf"):
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(content_bytes))
                raw_resume = "\n".join(p.extract_text() or "" for p in reader.pages)
                raw_resume = re.sub(r'[ \t]+', ' ', raw_resume)
                raw_resume = re.sub(r'\n{3,}', '\n\n', raw_resume).strip()
            except Exception:
                raw_resume = content_bytes.decode("latin-1", errors="ignore")

        elif filename.endswith(".docx"):
            try:
                import zipfile
                zf = zipfile.ZipFile(io.BytesIO(content_bytes))
                xml_content = zf.read("word/document.xml").decode("utf-8", errors="ignore")
                paragraphs = re.findall(r'<w:p[ >].*?</w:p>', xml_content, re.DOTALL)
                lines = []
                for para in paragraphs:
                    runs = re.findall(r'<w:t[^>]*>(.*?)</w:t>', para, re.DOTALL)
                    line = "".join(runs).strip()
                    if line:
                        lines.append(line)
                raw_resume = "\n".join(lines)
            except Exception:
                raw_resume = content_bytes.decode("utf-8", errors="ignore")

        else:
            raw_resume = content_bytes.decode("utf-8", errors="ignore")

    elif resume_text:
        raw_resume = resume_text.strip()

    if not raw_resume:
        raise HTTPException(status_code=400, detail="Please provide a resume file or paste resume text.")

    jd_text = job_description.strip()
    if not jd_text:
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    # ── 2. Extract skills from both documents ─────────────────────────────────
    resume_skills = set(extract_skills(raw_resume))
    jd_skills     = set(extract_skills(jd_text))

    if not jd_skills:
        # Fallback: no ontology skills found in JD — still give a keyword-coverage score
        jd_skills = set()

    found_skills   = sorted(resume_skills & jd_skills)
    missing_skills = sorted(jd_skills - resume_skills)

    # ── 3. Compute match score ────────────────────────────────────────────────
    if jd_skills:
        skill_match_score = round(len(found_skills) / len(jd_skills) * 100)
    else:
        skill_match_score = 0

    # Keyword coverage: fraction of unique JD words (>3 chars) present in resume
    jd_words     = set(w.lower() for w in re.findall(r'\b\w{4,}\b', jd_text))
    resume_words = set(w.lower() for w in re.findall(r'\b\w{4,}\b', raw_resume))
    keyword_coverage = round(len(jd_words & resume_words) / len(jd_words) * 100) if jd_words else 0

    # Blended score: 70% skill match + 30% keyword coverage
    match_score = round(skill_match_score * 0.70 + keyword_coverage * 0.30)
    match_score = max(0, min(100, match_score))

    return {
        "matchScore":      match_score,
        "skillMatchScore": skill_match_score,
        "keywordCoverage": keyword_coverage,
        "foundSkills":     found_skills,
        "missingSkills":   missing_skills,
        "totalJdSkills":   len(jd_skills),
        "totalResumeSkills": len(resume_skills),
    }


# ----------------- CAREER GAP ANALYSIS -----------------

@app.post("/api/career-gap")
def career_gap_analysis(payload: CareerGapPayload, db: Session = Depends(get_db)):
    """
    Analyse the gap between a user's current skills and the skills required
    for a target role.

    Accepts:
      - roleId        : one of the role IDs from role_profiles.json
      - currentSkills : list of skill strings (manual input from UI)
      - userId        : if provided AND currentSkills is absent, pull skills from
                        the user's latest resume stored in the DB
    """
    profiles = load_role_profiles()
    profile = next((p for p in profiles if p["roleId"] == payload.roleId), None)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Role '{payload.roleId}' not found.")

    # ── 1. Resolve current skills ────────────────────────────────────────────
    current_skills: list[str] = []

    if payload.currentSkills:
        # Normalise via the skill extractor — run them through extract_skills
        # by joining into a fake text blob so the ontology normalises aliases.
        fake_text = " ".join(payload.currentSkills)
        current_skills = extract_skills(fake_text)
        # If nothing matched the ontology, fall back to raw input
        if not current_skills:
            current_skills = [s.strip() for s in payload.currentSkills if s.strip()]
    elif payload.userId:
        # Pull the user's latest resume from DB and extract skills from stored text
        latest_resume = (
            db.query(Resume)
            .filter(Resume.user_id == payload.userId)
            .order_by(Resume.id.desc())
            .first()
        )
        if latest_resume and latest_resume.extracted_text:
            current_skills = extract_skills(latest_resume.extracted_text)

    current_set = set(current_skills)

    # ── 2. Required & preferred skill sets ───────────────────────────────────
    req_set  = set(profile["requiredSkills"])
    pref_set = set(profile["preferredSkills"])
    all_role_skills = req_set | pref_set

    resources = profile.get("learningResources", {})

    def build_skill_item(skill: str, category: str) -> dict:
        res = resources.get(skill, {"name": f"Learn {skill}", "url": f"https://www.google.com/search?q=learn+{skill.replace(' ','+')}"})
        return {
            "name":         skill,
            "category":     category,   # "required" | "preferred"
            "resourceName": res.get("name", f"Learn {skill}"),
            "resourceUrl":  res.get("url", "#"),
        }

    # ── 3. Classify skills ───────────────────────────────────────────────────
    # Missing required (critical gap)
    missing_required  = [build_skill_item(s, "required")  for s in sorted(req_set  - current_set)]
    # Missing preferred (nice-to-have gap)
    missing_preferred = [build_skill_item(s, "preferred") for s in sorted(pref_set - current_set)]
    # Skills you have that match this role
    matched_required  = sorted(req_set  & current_set)
    matched_preferred = sorted(pref_set & current_set)
    # Skills on resume not relevant to this role
    extra_skills = sorted(current_set - all_role_skills)

    total_missing = missing_required + missing_preferred

    # ── 4. Readiness score ───────────────────────────────────────────────────
    # Required skills carry 70% weight, preferred 30%
    req_score  = round(len(matched_required)  / len(req_set)  * 100) if req_set  else 100
    pref_score = round(len(matched_preferred) / len(pref_set) * 100) if pref_set else 100
    readiness  = round(req_score * 0.70 + pref_score * 0.30)

    # ── 5. Gap severity label ────────────────────────────────────────────────
    if readiness >= 80:
        severity = "ready"
    elif readiness >= 50:
        severity = "partial"
    else:
        severity = "beginner"

    return {
        "role":              profile["name"],
        "roleId":            profile["roleId"],
        "description":       profile["description"],
        "readinessScore":    readiness,
        "severity":          severity,
        "requiredScore":     req_score,
        "preferredScore":    pref_score,
        "currentSkills":     sorted(current_skills),
        "matchedRequired":   matched_required,
        "matchedPreferred":  matched_preferred,
        "missingRequired":   missing_required,
        "missingPreferred":  missing_preferred,
        "allMissingSkills":  total_missing,
        "extraSkills":       extra_skills,
        "totalRequired":     len(req_set),
        "totalPreferred":    len(pref_set),
    }


# ----------------- RESUME ROUTING & ML ENDPOINTS -----------------


@app.post("/api/resumes/upload")
async def upload_resume(
    file: UploadFile = File(...),
    userId: int = Form(1), # Default fallback to User #1 for local demo simplification
    db: Session = Depends(get_db)
):
    filename = file.filename or "resume.txt"
    logger.info(f"Upload request: file={filename}, userId={userId}")
    try:
        # Read file contents
        content_bytes = await file.read()
        logger.info(f"File size: {len(content_bytes)} bytes")
        
        # For PDF files, use pypdf for reliable text extraction
        if filename.lower().endswith('.pdf'):
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(content_bytes))
                pages_text = []
                for page in reader.pages:
                    page_text = page.extract_text() or ""
                    pages_text.append(page_text)
                extracted_text = "\n".join(pages_text)
                # Clean up extra whitespace
                extracted_text = re.sub(r'[ \t]+', ' ', extracted_text)
                extracted_text = re.sub(r'\n{3,}', '\n\n', extracted_text).strip()
            except Exception as pdf_err:
                logger.warning(f"pypdf extraction failed: {pdf_err}, attempting raw fallback")
                # Raw bytes printable text fallback
                raw = content_bytes.decode('latin-1', errors='ignore')
                extracted_text = re.sub(r'[^\x20-\x7E\n]', ' ', raw)
                extracted_text = re.sub(r' +', ' ', extracted_text).strip()
        elif filename.lower().endswith('.docx'):
            # Extract text from DOCX by reading only <w:t> text-run elements
            # per paragraph <w:p> — this avoids XML attribute/namespace garbage
            try:
                import zipfile
                zf = zipfile.ZipFile(io.BytesIO(content_bytes))
                xml_content = zf.read('word/document.xml').decode('utf-8', errors='ignore')
                # Split into paragraphs, then pull only the <w:t> text runs within each
                paragraphs = re.findall(r'<w:p[ >].*?</w:p>', xml_content, re.DOTALL)
                para_lines = []
                for para in paragraphs:
                    # Extract all text run contents; preserve xml:space="preserve" spacing
                    runs = re.findall(r'<w:t[^>]*>(.*?)</w:t>', para, re.DOTALL)
                    line = ''.join(runs).strip()
                    if line:
                        para_lines.append(line)
                extracted_text = '\n'.join(para_lines)
                extracted_text = re.sub(r'\n{3,}', '\n\n', extracted_text).strip()
                logger.info(f"DOCX w:t extraction produced {len(extracted_text)} chars")
            except Exception as docx_err:
                logger.warning(f"DOCX w:t extraction failed: {docx_err}, using tag-strip fallback")
                try:
                    extracted_text = re.sub(r'<[^>]+>', ' ', xml_content)
                    extracted_text = re.sub(r' +', ' ', extracted_text).strip()
                except Exception:
                    extracted_text = content_bytes.decode('utf-8', errors='ignore')
        else:
            # Plain text (TXT) - decode directly
            extracted_text = content_bytes.decode('utf-8', errors='ignore')
        
        logger.info(f"Extracted text length: {len(extracted_text)}")
    except Exception as e:
        logger.error(f"File read error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to read file content: {str(e)}")
        
    if not extracted_text.strip():
        logger.error("No text could be extracted from the uploaded file")
        raise HTTPException(
            status_code=422,
            detail="Could not extract readable text from your file. Please ensure it is not a scanned image PDF. Try saving as a text-based PDF or upload a .txt / .docx version instead."
        )
    
    try:
        # Run the NLP parsing and score calculations
        analysis_results = parse_and_score(extracted_text)
        logger.info(f"Analysis complete. Score: {analysis_results['overallScore']}")
        
        # Verify user exists
        user_exists = db.query(User).filter(User.id == userId).first()
        if not user_exists:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session is invalid. Please log in again."
            )
        
        # Write Resume entry
        new_resume = Resume(
            user_id=userId,
            title=filename,
            extracted_text=extracted_text[:10000],  # Limit stored text size
            parsed_json=json.dumps(analysis_results["parsedJson"], ensure_ascii=False)
        )
        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)
        
        # Write Analysis entry
        new_analysis = Analysis(
            resume_id=new_resume.id,
            overall_score=analysis_results["overallScore"],
            section_scores=json.dumps(analysis_results["sectionScores"]),
            recommendations=json.dumps(analysis_results["recommendations"], ensure_ascii=False),
            role_matches=json.dumps(analysis_results["roleMatches"], ensure_ascii=False)
        )
        db.add(new_analysis)
        
        # Record version — fix: join before filter
        prev_resume = db.query(Resume).filter(
            Resume.user_id == userId, Resume.id != new_resume.id
        ).order_by(Resume.id.desc()).first()
        prev_id = prev_resume.id if prev_resume else None
        
        existing_version_count = (
            db.query(Version)
            .join(Resume, Version.resume_id == Resume.id)
            .filter(Resume.user_id == userId)
            .count()
        )
        
        new_version = Version(
            resume_id=new_resume.id,
            prev_resume_id=prev_id,
            version_number=existing_version_count + 1
        )
        db.add(new_version)
        db.commit()
        
        return {
            "success": True,
            "message": "Resume uploaded and analyzed successfully.",
            "resumeId": new_resume.id,
            "overallScore": analysis_results["overallScore"],
            "analysis": {
                "overallScore": analysis_results["overallScore"],
                "sectionScores": analysis_results["sectionScores"],
                "recommendations": analysis_results["recommendations"],
                "roleMatches": analysis_results["roleMatches"],
                "extractedText": extracted_text
            }
        }
    except Exception as e:
        logger.error(f"Analysis pipeline error: {type(e).__name__}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/resumes/{id}/analysis")
def get_analysis(id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.resume_id == id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis details not found")
        
    resume = db.query(Resume).filter(Resume.id == id).first()
    extracted_text = resume.extracted_text if resume else ""
    
    return {
        "resumeId": analysis.resume_id,
        "overallScore": analysis.overall_score,
        "sectionScores": json.loads(analysis.section_scores),
        "recommendations": json.loads(analysis.recommendations),
        "roleMatches": json.loads(analysis.role_matches),
        "extractedText": extracted_text
    }

@app.post("/api/resumes/{id}/apply-suggestion")
def apply_suggestion(id: int, payload: SuggestionPayload, db: Session = Depends(get_db)):
    suggestion_id = payload.suggestionId
    custom_text = payload.customText
    
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Simulates replacing raw text with the suggested rewrite rule.
    # In a full app, we would swap out the specific bullet line. Here we append or edit the text.
    updated_text = resume.extracted_text
    if custom_text:
        # Replace the unquantified bullet list item with custom_text in the experience text
        updated_text += f"\n• [Updated Achievement]: {custom_text}"
        
    # Re-run scoring on modified text
    analysis_results = parse_and_score(updated_text)
    
    # Save as new version
    new_resume = Resume(
        user_id=resume.user_id,
        title=f"Improved_{resume.title}",
        extracted_text=updated_text,
        parsed_json=json.dumps(analysis_results["parsedJson"])
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    
    new_analysis = Analysis(
        resume_id=new_resume.id,
        overall_score=analysis_results["overallScore"],
        section_scores=json.dumps(analysis_results["sectionScores"]),
        recommendations=json.dumps(analysis_results["recommendations"]),
        role_matches=json.dumps(analysis_results["roleMatches"])
    )
    db.add(new_analysis)
    
    prev_version = db.query(Version).filter(Version.resume_id == id).first()
    prev_number = prev_version.version_number if prev_version else 1
    
    new_version = Version(
        resume_id=new_resume.id,
        prev_resume_id=id,
        version_number=prev_number + 1
    )
    db.add(new_version)
    db.commit()
    
    return {
        "success": True,
        "newResumeId": new_resume.id,
        "newScore": analysis_results["overallScore"]
    }

@app.get("/api/users/{userId}/history")
def get_user_history(userId: int, db: Session = Depends(get_db)):
    user_exists = db.query(User).filter(User.id == userId).first()
    if not user_exists:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User session is invalid. Please log in again."
        )
    versions = db.query(Version).join(Resume, Version.resume_id == Resume.id).filter(Resume.user_id == userId).all()
    history = []
    
    for v in versions:
        resume = db.query(Resume).filter(Resume.id == v.resume_id).first()
        analysis = db.query(Analysis).filter(Analysis.resume_id == v.resume_id).first()
        if resume and analysis:
            created_at_str = resume.created_at.isoformat() if resume.created_at else None
            history.append({
                "resumeId": resume.id,
                "title": resume.title,
                "overallScore": analysis.overall_score,
                "versionNumber": v.version_number,
                "createdAt": created_at_str
            })
            
    return sorted(history, key=lambda x: x["versionNumber"], reverse=True)

@app.delete("/api/resumes/{id}")
def delete_resume(id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Delete associated records first (cascading order)
    db.query(Version).filter(Version.resume_id == id).delete()
    db.query(Analysis).filter(Analysis.resume_id == id).delete()
    db.delete(resume)
    db.commit()

    return {"success": True, "message": f"Resume {id} deleted successfully."}

@app.get("/api/roles")
def get_roles():
    return load_role_profiles()

@app.get("/api/admin/cohort-stats")
def get_cohort_stats(db: Session = Depends(get_db)):
    analyses = db.query(Analysis).all()
    if not analyses:
        return {"totalStudents": 0, "averageScore": 0, "topDeficiencies": [], "scoreDistribution": {"under60": 0, "sixtyToEighty": 0, "aboveEighty": 0}}
        
    total_students = len(analyses)
    total_score = sum(a.overall_score for a in analyses)
    avg_score = round(total_score / total_students, 1)
    
    under_60 = sum(1 for a in analyses if a.overall_score < 60)
    sixty_eighty = sum(1 for a in analyses if 60 <= a.overall_score <= 80)
    above_eighty = sum(1 for a in analyses if a.overall_score > 80)
    
    # Collect mock missing skills to populate admin reports
    missing_count = {"React": 12, "TypeScript": 8, "SQL": 6, "Docker": 4}
    top_deficiencies = [{"skillName": k, "countMissing": v} for k, v in missing_count.items()]
    
    return {
        "totalStudents": total_students,
        "averageScore": avg_score,
        "topDeficiencies": top_deficiencies,
        "scoreDistribution": {
            "under60": under_60,
            "sixtyToEighty": sixty_eighty,
            "aboveEighty": above_eighty
        }
    }


# ----------------- HEALTH CHECK -----------------

@app.get("/api/health")
def health_check():
    """Lightweight ping endpoint used by the frontend to pre-warm the server
    on app load (Render free tier spins down after 15 min of inactivity)."""
    return {"status": "ok", "service": "SkillPilot AI Backend"}

