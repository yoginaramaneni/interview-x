from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import Dict, Any

from app.schemas.auth import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    TokenRefreshRequest, ProfileResponse, ProfileUpdate
)
from app.auth.security import (
    hash_password, verify_password, create_access_token, create_refresh_token, decode_token
)
from app.database import (
    get_users_collection, get_profiles_collection, get_collection
)
from app.dependencies.auth import get_current_user
import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    users_col = get_users_collection()
    
    # Check if user already exists
    existing_user = await users_col.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and save user
    hashed_pwd = hash_password(user_data.password)
    new_user = {
        "email": user_data.email,
        "hashed_password": hashed_pwd,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await users_col.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Create empty user profile
    profiles_col = get_profiles_collection()
    new_profile = {
        "user_id": user_id,
        "full_name": user_data.full_name,
        "bio": None,
        "skills": [],
        "experience": [],
        "education": [],
        "certifications": [],
        "updated_at": datetime.now(timezone.utc)
    }
    await profiles_col.insert_one(new_profile)
    
    return {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "created_at": new_user["created_at"]
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users_col = get_users_collection()
    user = await users_col.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id, "role": user["role"]})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    # Store refresh token in database for rotation/revocation
    refresh_tokens_col = get_collection("refresh_tokens")
    await refresh_tokens_col.insert_one({
        "user_id": user_id,
        "token": refresh_token,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_data: TokenRefreshRequest):
    try:
        payload = decode_token(refresh_data.refresh_token, is_refresh=True)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token claims"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Verify token exists in database
    refresh_tokens_col = get_collection("refresh_tokens")
    token_record = await refresh_tokens_col.find_one({
        "user_id": user_id,
        "token": refresh_data.refresh_token
    })
    
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or invalid"
        )
        
    # Get user to include role in access token
    users_col = get_users_collection()
    user = await users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Generate new tokens
    new_access_token = create_access_token(data={"sub": user_id, "role": user["role"]})
    new_refresh_token = create_refresh_token(data={"sub": user_id})
    
    # Rotate refresh token: delete old, insert new
    await refresh_tokens_col.delete_one({"_id": token_record["_id"]})
    await refresh_tokens_col.insert_one({
        "user_id": user_id,
        "token": new_refresh_token,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(refresh_data: TokenRefreshRequest, current_user: dict = Depends(get_current_user)):
    refresh_tokens_col = get_collection("refresh_tokens")
    # Delete the refresh token record for this user
    result = await refresh_tokens_col.delete_one({
        "user_id": current_user["id"],
        "token": refresh_data.refresh_token
    })
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token already invalidated or not found"
        )
    return {"detail": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    profiles_col = get_profiles_collection()
    
    # Fetch profile
    profile = await profiles_col.find_one({"user_id": current_user["id"]})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Prepare update fields
    update_dict = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc)
        await profiles_col.update_one(
            {"_id": profile["_id"]},
            {"$set": update_dict}
        )
        profile = await profiles_col.find_one({"_id": profile["_id"]})
        
    profile["id"] = str(profile["_id"])
    return profile
