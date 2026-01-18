from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

# Silence noisy HTTP connection logs
logging.getLogger("httpx").setLevel(logging.WARNING)

# Import routers
from .routers import auth, users, text, images, videos, activities, posts, social, contact

# Initialize Firebase (this will run when the module is imported)
from . import firebase_config

# Import scheduler
from .services.post_scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - starts/stops background tasks"""
    # Startup: Start the post scheduler
    await start_scheduler()
    
    yield
    
    # Shutdown: Stop the post scheduler
    await stop_scheduler()


app = FastAPI(
    title="MediaMint API",
    description="MediaMint Backend API with Firebase Firestore",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def add_ngrok_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["ngrok-skip-browser-warning"] = "true"
    return response

# Static files for web templates
app.mount("/static", StaticFiles(directory="ContentApp/static"), name="static")

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(text.router)
app.include_router(images.router)
app.include_router(videos.router)
app.include_router(activities.router)
app.include_router(posts.router)
app.include_router(social.router)
app.include_router(contact.router)



@app.get("/")
async def root():
    return {"message": "MediaMint API is running with Firebase!", "status": "healthy"}






