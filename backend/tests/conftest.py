import sys
import os
import pytest
import pytest_asyncio
from unittest.mock import MagicMock, AsyncMock
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Set environment variables for testing
os.environ["GEMINI_API_KEY"] = "mock-api-key"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017/test_db"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["JWT_REFRESH_SECRET"] = "test-refresh-secret"

@pytest.fixture(autouse=True)
def mock_mongodb(monkeypatch):
    """Mock the connect_db, disconnect_db, and database collections."""
    mock_db = MagicMock()
    
    # Mock collections to return async mocks
    mock_coll = MagicMock()
    mock_coll.find_one = AsyncMock(return_value=None)
    mock_coll.insert_one = AsyncMock(return_value=MagicMock(inserted_id="6655c65f9b4566a7b1ee3fbd"))
    mock_coll.update_one = AsyncMock(return_value=MagicMock(modified_count=1))
    mock_coll.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
    mock_coll.delete_many = AsyncMock(return_value=MagicMock(deleted_count=1))
    mock_coll.find = MagicMock()
    
    # Set up find mock iterator
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    
    async def mock_async_for(*args, **kwargs):
        return
        yield
        
    # We patch async for generator behavior
    mock_cursor.__aiter__ = lambda self: mock_cursor
    mock_cursor.__anext__ = AsyncMock(side_effect=StopAsyncIteration)
    mock_coll.find.return_value = mock_cursor

    monkeypatch.setattr("app.database.connect_db", lambda: None)
    monkeypatch.setattr("app.database.disconnect_db", lambda: None)
    
    # Patch get_collection to return our mock collection
    monkeypatch.setattr("app.database.get_collection", lambda name: mock_coll)

@pytest_asyncio.fixture
async def app_client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
