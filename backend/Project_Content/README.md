# MediaMint Backend (FastAPI)

This folder contains the backend services for the MediaMint project, built using **FastAPI**.

---

## 🚀 Running the Backend

### 1. Navigate to the backend directory
```bash
cd backend/Project_Content
python -m venv venv

venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn ContentApp.main:app --reload --host 0.0.0.0 --port 8000
