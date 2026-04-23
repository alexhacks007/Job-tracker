# Job Tracker Pro - Comprehensive Architecture & Concept Guide

## 1. Project Concept & Vision
**Job Tracker Pro** is an intense, high-octane career management platform designed for ambitious professionals. Far from a standard spreadsheet tracker, it functions as a comprehensive "Mission Control" center for the modern job hunt. 

Its design philosophy heavily relies on a premium 2026 SaaS aesthetic ("Cyber-Luminous"), featuring extensive use of deep slates, vibrant interactive gradients (Indigos, Emeralds, Oranges), and pervasive glassmorphism. The application not only tracks passive data but aims to actively reduce the cognitive load of a job search through integrated intelligence, real-time analytics, and unified task management.

## 2. Technical Stack & Architecture
- **Frontend Core**: React 18 (Vite), React Router v6.
- **Styling**: Tailwind CSS (Native utility classes + arbitrary value tokens). Mobile-first, touch-optimized components.
- **Animations**: Framer Motion for high-fidelity micro-interactions and route transitions.
- **Charts/Data Vis**: Recharts for dynamic, responsive Area, Bar, and Pie graphs.
- **Backend Core**: **Django (Python)** - Migrated from Node.js for enhanced scalability, robust ORM, and superior authentication management.
- **API Engine**: Django REST Framework (DRF) with JWT (SimpleJWT) for stateless authentication.
- **Database**: SQLite3 (lightweight, portable relational storage, optimized for performance).
- **Automation**: Integrated **Email Campaign Engine** for bulk recruiter outreach.
- **Version Control**: Git / GitHub (Repository: `alexhacks007/Job-tracker`).

## 3. Core Entities / Logics (Django Models)

### Applications (Jobs)
The core tracking entity. Fields include `company_name`, `job_role`, `location`, `salary`, `platform`, and `status` ('Applied', 'Interview', 'Offer', 'Rejected', 'Pending'). Supports full CRUD via DRF.

### Tasks (TODOs)
A deeply integrated task matrix. Tasks have priority levels (`High`, `Medium`, `Low`), status (pending/done), and are linked to specific dates. Features **Alert Integration** (`alert_enabled`, `alert_type`) for proactive notifications.

### Companies & Contacts
Centralized directory for companies users are targeting. Stores metadata like `company_size`, `company_type`, `website`, and direct contact emails used for automation.

### Email Campaign Engine
A high-power outreach module allowing users to:
- Create **Email Templates** with variable substitution (`{{company_name}}`, `{{company_location}}`).
- Attach **Resumes** dynamically to outgoing emails.
- Run **Bulk Campaigns** targeting multiple companies simultaneously.
- Track real-time **Email Logs** (Pending, Sent, Failed) with error reporting.

## 4. Page Functionality Breakdown

### 1. The Dashboard (`/`)
The analytical brain of the application.
- **KPI Cards**: Displays Total Applications, Interviews, Offers, and Response Rates.
- **Application Insights Module**: Recharts-powered trend analysis (Area Chart) and weekly distribution (Bar Chart).
- **Health Score**: A custom SVG animated dial representing a user's current engagement rating.

### 2. Job Discovery (`/discover`)
A real-time, global opportunity scanner.
- **Remotive API Integration**: Fetches live remote software, design, product, and data jobs. 
- **"One-Click" Tracker Sync**: Instantly push external jobs into the personal tracking matrix.

### 3. Application Tracker (`/jobs`)
- **Multi-View Modes**: Toggle between Data Grid and List views.
- **Intelligent Filtering**: Quick pills for lifecycle status.

### 4. Email Campaigns (`/campaigns`)
- **Template Builder**: Design high-conversion recruiter emails.
- **Campaign Execution**: Select multiple companies and trigger bulk outreach threads.
- **Live Status Tracking**: Monitor progress of background email processing.

### 5. Mission Control Calendar (`/calendar`)
- **Date-Specific Heatmapping**: Visual indicators for task intensity.
- **Tactical Snapshot**: Daily summaries of interviews and follow-ups.

### 6. Identity Matrix (`/profile`)
- **Branding**: Profile customization and carrier link management (LinkedIn, Naukri, Portfolio).
- **Security**: Password management and account purging.

## 5. RBAC & Identity System
Managed via a custom Django User model and linked Role/Permission tables:
- **Role Hierarchy**: Super Admin, Admin, Analyst AI, Moderator, Premium User, Free User, Guest.
- **Permission Matrix**: `USER_MANAGEMENT`, `JOB_MANAGEMENT`, `TASK_MANAGEMENT`, `ANALYTICS_ACCESS`, `AI_INSIGHTS`, `BEHAVIOR_TRACKING`, `SYSTEM_CONTROL`.

## 6. Next-Level Features (Psychology + Behavior)
**Behavior Metric Engine**: Tracks `consistency_score`, `focus_score`, `drop_rate`, `action_speed`, and `cognitive_load`.
- **Psychological Tagging**: Users are auto-tagged (e.g., `🚀 Highly Driven`, `⚠️ Burnout Risk`) based on activity logs.
- **AI Insight Engine**: Generates contextual messages and predictions (e.g., "User likely to quit in 3 days").

## 7. Backend Architecture (Django Flow)
**Frontend (React)** → **JWT Auth** → **Django REST API** → **RBAC Middleware** → **Service Layer (Campaigns/Analytics)** → **Database (SQLite)**

---
> **🔥 PROJECT STATUS**: Git Initialized & Pushed to GitHub.
> **🔥 CORE STACK**: Django + React + SQLite.
> **🔥 FINAL VISION**: AI-Powered Career Intelligence Platform with Behavioral Control.
