from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from contextlib import asynccontextmanager

# SQLModel imports
from sqlmodel import SQLModel, Session, select, Field

# Local imports
from database import create_db_and_tables, get_session, engine

# --- Models ---
# This model is for both the API (Pydantic) and the DB (SQLModel)
class Tool(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True) # e.g., "data-uploader"
    name: str                                  # e.g., "Data Uploader"
    description: str
    target_path: str # e.g., "/uploader" or "https://google.com"


# --- One-time startup logic ---
def create_initial_tools(session: Session):
    # We only add sample tools if the database is EMPTY
    statement = select(Tool)
    existing_tools = session.exec(statement).first()

    if not existing_tools:
        print("Database is empty, adding initial tools...")
        tools_to_add = [
            Tool(
                slug="bx-website",
                name="BlueXPRT Website",
                description="BlueXPRT Website",
                target_path="https://www.blue-expert.com"
            ),
            Tool(
                slug="notion",
                name="Notion",
                description="Notion",
                target_path="https://www.notion.so"
            )
        ]
        for tool in tools_to_add:
            session.add(tool)
        session.commit()
        print("Initial tools added.")
    else:
        print("Database already populated.")

# 'lifespan' manages startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code that runs ONCE on startup
    print("Server starting up...")
    create_db_and_tables()
    with Session(engine) as session:
        create_initial_tools(session)
    yield
    # Code that runs ONCE on shutdown (if needed)
    print("Server shutting down.")

app = FastAPI(lifespan=lifespan)

# --- CORS Middleware ---
# This is crucial! It allows your React app (on port 3000)
# to talk to this backend (on port 8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Only allow port 3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---
@app.get("/")
def get_root():
    return {"message": "Welcome to the Portal Backend"}

@app.get("/api/tools", response_model=List[Tool])
def get_all_tools(session: Session = Depends(get_session)):
    """
    The main endpoint. Fetches all tools from the database.
    """
    statement = select(Tool)
    tools = session.exec(statement).all()
    return tools