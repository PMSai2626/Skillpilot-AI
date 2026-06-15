import re
import json
import os

# Skill ontology — keys are resume variants, values are canonical skill names.
# IMPORTANT: Multi-word keys (e.g. "Data Visualization") use phrase search (re.search),
# so they work even though tokenisation splits on whitespace.
SKILL_ONTOLOGY = {
    # ── Frontend ───────────────────────────────────────────────────────────────
    "HTML": "HTML", "CSS": "CSS",
    "JavaScript": "JavaScript", "JS": "JavaScript",
    "TypeScript": "TypeScript", "TS": "TypeScript",
    "React": "React", "ReactJS": "React", "React.js": "React",
    "Next.js": "Next.js", "NextJS": "Next.js",
    "Redux": "Redux", "Tailwind": "TailwindCSS", "TailwindCSS": "TailwindCSS",
    "Webpack": "Webpack", "Sass": "Sass", "SCSS": "Sass",

    # ── Backend ────────────────────────────────────────────────────────────────
    "Node.js": "Node.js", "NodeJS": "Node.js",
    "Python": "Python",
    "FastAPI": "FastAPI", "Flask": "Flask", "Django": "Django",
    "Express": "Express",
    "REST APIs": "REST APIs", "RESTful": "REST APIs", "REST API": "REST APIs",
    "GraphQL": "GraphQL", "Redis": "Redis",

    # ── Databases ──────────────────────────────────────────────────────────────
    "SQL": "SQL", "MySQL": "MySQL", "SQLite": "SQLite",
    "PostgreSQL": "PostgreSQL", "Postgres": "PostgreSQL",
    "MongoDB": "MongoDB", "Mongo": "MongoDB",

    # ── DevOps / Cloud ─────────────────────────────────────────────────────────
    "Git": "Git", "GitHub": "Git",
    "Docker": "Docker",
    "Kubernetes": "Kubernetes", "K8s": "Kubernetes",
    "AWS": "AWS", "Azure": "Azure", "GCP": "GCP",
    "Linux": "Linux", "Unix": "Linux",
    "Bash": "Bash", "Shell": "Bash",
    "Terraform": "Terraform",
    "CI/CD": "CI/CD", "GitHub Actions": "GitHub Actions",
    "Nginx": "Nginx",
    "Networking Basics": "Networking Basics", "Networking": "Networking Basics",

    # ── Testing / QA ───────────────────────────────────────────────────────────
    "Selenium": "Selenium",
    "Playwright": "Playwright",
    "Cypress": "Cypress",
    "Jest": "Jest", "JUnit": "JUnit",
    "Postman": "Postman",
    "Manual Testing": "Manual Testing", "Manual Test": "Manual Testing",

    # ── Data Science / Analytics ───────────────────────────────────────────────
    "Pandas": "Pandas",
    "NumPy": "NumPy",
    "Excel": "Excel", "Microsoft Excel": "Excel",
    "Tableau": "Tableau",
    "PowerBI": "PowerBI", "Power BI": "PowerBI",
    "Statistics": "Statistics", "Statistical": "Statistics",
    "R": "R",
    "Data Visualization": "Data Visualization",
    "Data Analysis": "Data Analysis",
    "Data Analyst": "Data Analysis",
    "Jupyter": "Jupyter",

    # ── Machine Learning ───────────────────────────────────────────────────────
    "PyTorch": "PyTorch",
    "TensorFlow": "TensorFlow",
    "Scikit-Learn": "Scikit-Learn", "sklearn": "Scikit-Learn", "scikit-learn": "Scikit-Learn",
    "Machine Learning": "Machine Learning", "ML": "Machine Learning",
    "Deep Learning": "Deep Learning",
    "NLP": "NLP",
    "MLOps": "MLOps",
    "CUDA": "CUDA",
    "Hugging Face": "Hugging Face",
    "Mathematics": "Mathematics", "Math": "Mathematics",
    "Machine Learning Basics": "Machine Learning",
}


def extract_skills(text):
    """Extract canonical skills from resume text using the SKILL_ONTOLOGY."""
    found_skills = set()

    # Pass 1 — exact single-token match (fast)
    cleaned = re.sub(r'[^\w\s\.\-/]', ' ', text)
    tokens = set(cleaned.split())
    for token in tokens:
        for key, val in SKILL_ONTOLOGY.items():
            if token.lower() == key.lower():
                found_skills.add(val)

    # Pass 2 — phrase / multi-word match for all keys with len > 2
    for key, val in SKILL_ONTOLOGY.items():
        if len(key) > 2:
            pattern = r'(?<![A-Za-z])' + re.escape(key) + r'(?![A-Za-z])'
            if re.search(pattern, text, re.IGNORECASE):
                found_skills.add(val)

    return list(found_skills)

def load_role_profiles():
    """Loads career profiles from the parent folder."""
    profiles_path = os.path.join(os.path.dirname(__file__), "..", "role_profiles.json")
    if os.path.exists(profiles_path):
        with open(profiles_path, "r") as f:
            return json.load(f)
    return []

def extract_contact_info(text):
    contact = {"name": None, "email": None, "phone": None, "links": []}
    
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        contact["email"] = email_match.group(0)
        
    phone_match = re.search(r'\(?\+?[0-9]{1,3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}', text)
    if phone_match:
        contact["phone"] = phone_match.group(0)
        
    links = re.findall(r'(?:github\.com|linkedin\.com/in|linkedin\.com/pub)[\w/-]+', text, re.IGNORECASE)
    contact["links"] = [link.strip() for link in links]
    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if lines:
        contact["name"] = lines[0]
        
    return contact

def segment_sections(text):
    sections = {"summary": "", "skills": "", "experience": "", "education": "", "projects": ""}
    headers = {
        "summary": ["summary", "profile", "professional summary", "about me"],
        "skills": ["skills", "technical skills", "technologies", "skill set"],
        "experience": ["experience", "work experience", "employment", "professional history", "internships"],
        "education": ["education", "academic details", "academic background"],
        "projects": ["projects", "academic projects", "personal projects"]
    }
    
    lower_text = text.lower()
    header_indices = []
    
    for section_name, variants in headers.items():
        for variant in variants:
            pattern = r'\b' + re.escape(variant) + r'\b'
            for match in re.finditer(pattern, lower_text):
                header_indices.append((match.start(), match.end(), section_name))
                
    header_indices = sorted(header_indices, key=lambda x: x[0])
    
    if not header_indices:
        sections["experience"] = text
        return sections
        
    for i in range(len(header_indices)):
        current_start = header_indices[i][1]
        current_section = header_indices[i][2]
        if i + 1 < len(header_indices):
            current_end = header_indices[i+1][0]
        else:
            current_end = len(text)
        sections[current_section] += text[current_start:current_end].strip() + "\n"
        
    return sections



def evaluate_formatting(text):
    score = 100
    deductions = []
    
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    for p in paragraphs:
        if len(p) > 500 and '•' not in p and '-' not in p:
            score -= 15
            deductions.append("Large block of text detected. Use bullet points for experience listings.")
            break
            
    bullet_types = []
    if '•' in text: bullet_types.append('bullet')
    if ' - ' in text: bullet_types.append('dash')
    if ' * ' in text: bullet_types.append('asterisk')
    
    if len(bullet_types) > 1:
        score -= 10
        deductions.append("Inconsistent bullet point styles detected. Standardize on one bullet character.")
        
    return max(0, score), deductions

def evaluate_achievements(text):
    bullets = re.findall(r'(?:•|-|\*)\s*(.*?)(?=\n(?:•|-|\*)|\n\n|$)', text, re.DOTALL)
    if not bullets:
        return 0, ["No bullet points found. Organize experience with bullets."]
        
    quantified_count = 0
    metric_pattern = r'\b\d+(?:%|\+|-|\s?users|k|m|b|\s?hours)?\b'
    
    for bullet in bullets:
        cleaned_bullet = re.sub(r'\b20\d{2}\b', '', bullet)
        if re.search(metric_pattern, cleaned_bullet, re.IGNORECASE) or re.search(r'\$\d+', cleaned_bullet):
            quantified_count += 1
            
    ratio = quantified_count / len(bullets)
    score = int(ratio * 100)
    
    suggestions = []
    if ratio < 0.3:
        suggestions.append(f"Only {quantified_count} of {len(bullets)} bullet points contain metrics. Quantify achievements.")
        
    return score, suggestions

def match_roles(skills, profiles, resume_text=""):
    """
    Match extracted skills against role profiles to produce ranked role recommendations.
    
    Improvements over naive skill-intersection scoring:
    1. Role-title keyword bonus — if the resume explicitly mentions a role's title/aliases,
       that role receives a significant confidence boost.
    2. Skill specificity weighting — skills shared by many roles (e.g. Python, SQL) carry
       less discriminating power; skills unique to a role are weighted more heavily.
    3. Preferred-skill coverage penalty — roles whose preferred (domain-specific) skills are
       mostly absent from the resume are penalised, preventing generic roles from floating up.
    """

    # ── 1. Build skill-specificity map ──────────────────────────────────────────
    # Count how many role profiles each skill appears in (required + preferred combined).
    skill_role_count: dict[str, int] = {}
    for profile in profiles:
        all_role_skills = set(profile["requiredSkills"]) | set(profile["preferredSkills"])
        for skill in all_role_skills:
            skill_role_count[skill] = skill_role_count.get(skill, 0) + 1

    total_roles = len(profiles)

    def specificity(skill: str) -> float:
        """Return a weight in [0.2, 1.0]: rare skills score higher."""
        count = skill_role_count.get(skill, 1)
        # Inverse-frequency: skill present in only 1 role → weight 1.0
        # skill present in all roles → weight 0.2
        return max(0.2, 1.0 - (count - 1) / max(total_roles - 1, 1) * 0.8)

    # ── 2. Role-title keyword map ────────────────────────────────────────────────
    # Maps roleId → list of keywords/phrases that, if found in the resume text,
    # signal the candidate is targeting that role.
    ROLE_TITLE_KEYWORDS: dict[str, list[str]] = {
        "data_analyst":      ["data analyst", "data analysis", "business analyst", "analytics",
                               "bi analyst", "reporting analyst", "data analytics"],
        "ml_engineer":       ["machine learning", "ml engineer", "deep learning", "ai engineer",
                               "data scientist", "nlp engineer"],
        "devops_engineer":   ["devops", "site reliability", "sre", "platform engineer",
                               "cloud engineer", "infrastructure engineer"],
        "backend_developer": ["backend developer", "backend engineer", "server-side developer",
                               "api developer"],
        "frontend_developer":["frontend developer", "front-end developer", "ui developer",
                               "web developer", "react developer"],
        "fullstack_developer":["full stack", "fullstack", "full-stack developer"],
        "qa_engineer":       ["qa engineer", "test automation", "quality assurance",
                               "software tester", "sdet"],
    }

    lower_text = resume_text.lower() if resume_text else ""

    matches = []
    for profile in profiles:
        role_id  = profile["roleId"]
        req_set  = set(profile["requiredSkills"])
        pref_set = set(profile["preferredSkills"])
        skills_set = set(skills)

        if not req_set:
            continue

        matched_req  = req_set.intersection(skills_set)
        matched_pref = pref_set.intersection(skills_set)

        # ── 3. Weighted required-skill score (specificity-aware) ────────────────
        req_weight_total   = sum(specificity(s) for s in req_set)
        req_weight_matched = sum(specificity(s) for s in matched_req)
        req_match_ratio    = req_weight_matched / req_weight_total if req_weight_total else 0

        # ── 4. Weighted preferred-skill score (specificity-aware) ───────────────
        pref_weight_total   = sum(specificity(s) for s in pref_set) if pref_set else 1
        pref_weight_matched = sum(specificity(s) for s in matched_pref)
        pref_match_ratio    = pref_weight_matched / pref_weight_total if pref_set else 1.0

        # ── 5. Preferred-coverage penalty ──────────────────────────────────────
        # If fewer than 20% of preferred (domain-specific) skills are present,
        # apply a penalty proportional to the gap. Max penalty: 0.25.
        pref_coverage = len(matched_pref) / len(pref_set) if pref_set else 1.0
        coverage_penalty = max(0.0, (0.20 - pref_coverage) * 1.25) if pref_coverage < 0.20 else 0.0

        base_score = (req_match_ratio * 0.70) + (pref_match_ratio * 0.30) - coverage_penalty

        # ── 6. Role-title keyword bonus ─────────────────────────────────────────
        title_bonus = 0.0
        if lower_text:
            keywords = ROLE_TITLE_KEYWORDS.get(role_id, [])
            for kw in keywords:
                if kw in lower_text:
                    title_bonus = 0.25   # strong signal — cap at first match
                    break

        confidence = round(min(1.0, max(0.0, base_score + title_bonus)), 2)

        missing = []
        for skill in req_set:
            if skill not in skills_set:
                resource = profile["learningResources"].get(
                    skill, {"name": f"Learn {skill}", "url": "https://google.com"}
                )
                missing.append({
                    "name": skill,
                    "resourceName": resource["name"],
                    "resourceUrl": resource["url"]
                })

        matches.append({
            "role": profile["name"],
            "confidence": confidence,
            "matchedSkills": list(matched_req.union(matched_pref)),
            "missingSkills": missing
        })

    matches = sorted(matches, key=lambda x: x["confidence"], reverse=True)
    return matches[:3]

def evaluate_projects_skills(projects_text, skills):
    if not projects_text.strip():
        return 0, ["Projects section is missing or empty. Add projects to showcase your technical skills."]
        
    if not skills:
        return 50, ["No core skills extracted. Complete the skills section first to cross-reference with your projects."]
        
    matched_skills = []
    for skill in skills:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, projects_text, re.IGNORECASE):
            matched_skills.append(skill)
            
    ratio = len(matched_skills) / len(skills)
    score = int(40 + (ratio * 60))
    score = min(100, max(0, score))
    
    deductions = []
    if ratio < 0.4:
        deductions.append(f"Only {len(matched_skills)} of your {len(skills)} core skills are referenced in your Projects section. Integrate more of your core skills (like {', '.join(skills[:2])}) into your project descriptions to demonstrate practical application.")
        
    return score, deductions

def parse_and_score(raw_text):
    sections = segment_sections(raw_text)
    contact = extract_contact_info(raw_text)
    skills = extract_skills(raw_text)
    
    contact_score = 0
    if contact["name"]: contact_score += 30
    if contact["email"]: contact_score += 30
    if contact["phone"]: contact_score += 20
    if len(contact["links"]) > 0: contact_score += 20
    
    format_score, format_deductions = evaluate_formatting(raw_text)
    
    section_score = 0
    if sections["skills"].strip(): section_score += 25
    if sections["experience"].strip(): section_score += 25
    if sections["education"].strip(): section_score += 25
    if sections["projects"].strip() or sections["summary"].strip(): section_score += 25
    
    profiles = load_role_profiles()
    role_matches = match_roles(skills, profiles, resume_text=raw_text)
    best_match_pct = role_matches[0]["confidence"] * 100 if role_matches else 50
    skills_score = int(best_match_pct)
    
    experience_score = 80 if len(sections["experience"]) > 100 else 40
    education_score = 90 if sections["education"].strip() else 0
    achieve_score, achieve_deductions = evaluate_achievements(sections["experience"])
    
    projects_score, projects_deductions = evaluate_projects_skills(sections["projects"], skills)
    
    # Updated re-balanced overall score mapping (Total 100%)
    total_score = int(
        (0.05 * contact_score) +
        (0.05 * format_score) +
        (0.10 * section_score) +
        (0.30 * skills_score) +
        (0.15 * experience_score) +
        (0.10 * projects_score) +
        (0.10 * education_score) +
        (0.15 * achieve_score)
    )
    
    recommendations = []
    rec_id = 1
    
    if contact_score < 80:
        recommendations.append({
            "id": f"rec_{rec_id}",
            "type": "structure",
            "priority": "Must-Fix",
            "impact": 15,
            "text": "Complete contact header. Ensure you have your name, email, phone, and professional GitHub/LinkedIn URLs."
        })
        rec_id += 1
        
    for dec in format_deductions:
        recommendations.append({
            "id": f"rec_{rec_id}",
            "type": "format",
            "priority": "Important",
            "impact": 10,
            "text": dec
        })
        rec_id += 1
        
    if section_score < 75:
        recommendations.append({
            "id": f"rec_{rec_id}",
            "type": "structure",
            "priority": "Must-Fix",
            "impact": 15,
            "text": "Your resume is missing core structural sections (Skills, Work Experience, or Education)."
        })
        rec_id += 1
        
    for dec in achieve_deductions:
        recommendations.append({
            "id": f"rec_{rec_id}",
            "type": "quantify",
            "priority": "Must-Fix",
            "impact": 15,
            "text": dec,
            "example": "Optimized database query lookup times, reducing API load by 40%."
        })
        rec_id += 1
        
    for dec in projects_deductions:
        recommendations.append({
            "id": f"rec_{rec_id}",
            "type": "keywords",
            "priority": "Important",
            "impact": 10,
            "text": dec,
            "example": "Developed full-stack web application incorporating React client interface and FastAPI backend services."
        })
        rec_id += 1
        
    return {
        "overallScore": total_score,
        "sectionScores": {
            "contact": contact_score,
            "formatting": format_score,
            "sections": section_score,
            "skills": skills_score,
            "experience": experience_score,
            "projects": projects_score,
            "education": education_score,
            "achievements": achieve_score
        },
        "parsedJson": {
            "contact": contact,
            "skills": skills,
            "experience": [sections["experience"]],
            "education": [sections["education"]],
            "projects": [sections["projects"]]
        },
        "recommendations": recommendations,
        "roleMatches": role_matches
    }
