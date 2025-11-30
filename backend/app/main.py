from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

# Import route modules
from app.routes import upload_route, extract_route, query_route, ai_route,delete_route
# Initialize app
app = FastAPI(
    title="LegalAI Backend",
    version="1.0.0",
    description="Backend service for LegalAI – upload, extract, and process legal documents."
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(upload_route.router)
app.include_router(extract_route.router)
app.include_router(query_route.router)
app.include_router(ai_route.router)
app.include_router(delete_route.router)   # ⬅ ADD THIS LINE

# Root
@app.get("/")
def home():
    return {
        "message": "Welcome to LegalAI Backend 🚀",
        "endpoints": ["/upload", "/extract_text", "/delete_file"],
        "status": "running"
    }
