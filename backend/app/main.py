import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import jwt

from app.config import settings
from app.database import connect_db, disconnect_db
from app.routers import auth, resume, job, interview, coding, aptitude, report

# Configure structured-like console logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Starting up FastAPI application...")
    try:
        connect_db()
    except Exception as e:
        logger.critical(f"Database connection failed at startup: {e}")
    yield
    # Shutdown actions
    logger.info("Shutting down FastAPI application...")
    disconnect_db()

app = FastAPI(
    title="InterviewAI X Backend API",
    description="Production-ready FastAPI backend for the AI-powered interview platform InterviewAI X",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Error/Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred."}
    )

@app.exception_handler(jwt.ExpiredSignatureError)
async def jwt_expired_exception_handler(request: Request, exc: jwt.ExpiredSignatureError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Token has expired."}
    )

@app.exception_handler(jwt.InvalidTokenError)
async def jwt_invalid_exception_handler(request: Request, exc: jwt.InvalidTokenError):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Invalid token."}
    )

# Basic health-check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "service": "InterviewAI X Backend"}

# Include routers
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(job.router)
app.include_router(interview.router)
app.include_router(coding.router)
app.include_router(aptitude.router)
app.include_router(report.router)
