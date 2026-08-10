import pytest
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId
from app.auth.security import create_access_token

@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": "6655c65f9b4566a7b1ee3fbd", "role": "candidate"})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_start_interview(app_client, auth_headers, monkeypatch):
    # Mock user document
    mock_user = {
        "_id": ObjectId("6655c65f9b4566a7b1ee3fbd"),
        "email": "test@example.com",
        "full_name": "Test User",
        "role": "candidate"
    }
    
    # Mock resume and job desc find_one
    mock_res_col = MagicMock()
    mock_res_col.find_one = AsyncMock(return_value={"_id": ObjectId("6655c65f9b4566a7b1ee3fbe")})
    
    mock_jobs_col = MagicMock()
    mock_jobs_col.find_one = AsyncMock(return_value={"_id": ObjectId("6655c65f9b4566a7b1ee3fbf")})
    
    mock_users_col = MagicMock()
    mock_users_col.find_one = AsyncMock(return_value=mock_user)
    
    mock_sessions_col = MagicMock()
    mock_sessions_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id=ObjectId("6655c65f9b4566a7b1ee3fc0")))

    def mock_get_collection(name):
        if name == "resumes":
            return mock_res_col
        elif name == "job_descriptions":
            return mock_jobs_col
        elif name == "users":
            return mock_users_col
        elif name == "interview_sessions":
            return mock_sessions_col
        return MagicMock()

    monkeypatch.setattr("app.database.get_collection", mock_get_collection)

    payload = {
        "resume_id": "6655c65f9b4566a7b1ee3fbe",
        "job_id": "6655c65f9b4566a7b1ee3fbf"
    }

    response = await app_client.post("/interview/start", json=payload, headers=auth_headers)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["status"] == "ongoing"
    assert "id" in res_data
    assert res_data["resume_id"] == "6655c65f9b4566a7b1ee3fbe"
    assert res_data["job_id"] == "6655c65f9b4566a7b1ee3fbf"
