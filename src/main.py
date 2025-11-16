from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models to ensure SQLAlchemy can resolve relationships
from src.models import (
    BaseTable,
    Project,
    Milestone,
    SponsoredProject,
    EvaluateResponse,
)
from src.routes.base_router import base_router
from src.routes.v1.escrow import router as escrow_router

app = FastAPI(title="Sub0 Funding Oracle API")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(base_router)
app.include_router(escrow_router, prefix="/api/v1/arkiv")
