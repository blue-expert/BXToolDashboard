import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_azure_auth import SingleTenantAzureAuthorizationCodeBearer
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from contextlib import asynccontextmanager

# SQLModel imports
from sqlmodel import SQLModel, Session, select, Field

# Local imports
from database import create_db_and_tables, get_session, engine

from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Models ---
# This model is for both the API (Pydantic) and the DB (SQLModel)
class Tool(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True)  # e.g., "data-uploader"
    name: str  # e.g., "Data Uploader"
    description: str
    target_path: str  # e.g., "/uploader" or "https://google.com"


azure_scheme = SingleTenantAzureAuthorizationCodeBearer(
    tenant_id=settings.tenant_id,
    app_client_id=settings.client_id,
    scopes={
        # This MUST match the scope you created in Azure ("Expose an API")
        f"api://{settings.client_id}/access_as_user": "Access the portal API"
    }
)

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
    # ... (same as before) ...
    print("Server starting up...")
    create_db_and_tables()
    with Session(engine) as session:
        create_initial_tools(session)
    yield
    print("Server shutting down.")


app = FastAPI(
    lifespan=lifespan,
    # ⭐️ Add the azure_scheme to OpenAPI docs ⭐️
    dependencies=[Depends(azure_scheme)]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    logger.info(f"Client ID: {settings.client_id}")
    statement = select(Tool)
    tools = session.exec(statement).all()
    return tools
