import pytest
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId

@pytest.mark.asyncio
async def test_health_check(app_client):
    response = await app_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "InterviewAI X Backend"}

@pytest.mark.asyncio
async def test_register_user(app_client, monkeypatch):
    # Mock find_one to return None (email not registered)
    mock_users_col = MagicMock()
    mock_users_col.find_one = AsyncMock(return_value=None)
    mock_users_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id=ObjectId("6655c65f9b4566a7b1ee3fbd")))
    
    mock_profiles_col = MagicMock()
    mock_profiles_col.insert_one = AsyncMock(return_value=MagicMock())

    def mock_get_collection(name):
        if name == "users":
            return mock_users_col
        elif name == "profiles":
            return mock_profiles_col
        return MagicMock()

    monkeypatch.setattr("app.database.get_collection", mock_get_collection)

    payload = {
        "email": "test@example.com",
        "password": "securepassword123",
        "full_name": "Test User",
        "role": "candidate"
    }
    
    response = await app_client.post("/auth/register", json=payload)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["email"] == "test@example.com"
    assert res_data["full_name"] == "Test User"
    assert "id" in res_data

@pytest.mark.asyncio
async def test_login_user(app_client, monkeypatch):
    from app.auth.security import hash_password
    
    # Mock find_one to return the registered user
    hashed = hash_password("securepassword123")
    mock_user = {
        "_id": ObjectId("6655c65f9b4566a7b1ee3fbd"),
        "email": "test@example.com",
        "hashed_password": hashed,
        "full_name": "Test User",
        "role": "candidate"
    }
    
    mock_users_col = MagicMock()
    mock_users_col.find_one = AsyncMock(return_value=mock_user)
    
    mock_token_col = MagicMock()
    mock_token_col.insert_one = AsyncMock(return_value=MagicMock())

    def mock_get_collection(name):
        if name == "users":
            return mock_users_col
        elif name == "refresh_tokens":
            return mock_token_col
        return MagicMock()

    monkeypatch.setattr("app.database.get_collection", mock_get_collection)

    payload = {
        "email": "test@example.com",
        "password": "securepassword123"
    }
    
    response = await app_client.post("/auth/login", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "access_token" in res_data
    assert "refresh_token" in res_data
    assert res_data["token_type"] == "bearer"
