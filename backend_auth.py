"""
Supabase JWT Authentication Middleware
Replaces custom JWT/OAuth logic with Supabase token verification
Reference: https://supabase.com/docs/guides/auth/server-side/verifying-jwts
"""
import os
import jwt
from typing import Optional
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

# Supabase JWT configuration
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")

if not SUPABASE_JWT_SECRET:
    raise ValueError("SUPABASE_JWT_SECRET must be set in environment variables")

# Security scheme for extracting Bearer token
security = HTTPBearer()

# Pydantic models for user data
class AuthUser(BaseModel):
    """Authenticated user extracted from Supabase JWT"""
    id: str  # Supabase user UUID
    email: str
    role: str = "authenticated"
    aud: str = "authenticated"
    
    class Config:
        frozen = True


def decode_token(token: str) -> dict:
    """
    Decode JWT token using Supabase secret
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded JWT payload
        
    Raises:
        jwt exceptions for various token errors
    """
    return jwt.decode(
        token,
        SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated",
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_aud": True,
        }
    )


def validate_claims(payload: dict) -> None:
    """
    Validate required JWT claims
    
    Args:
        payload: Decoded JWT payload
        
    Raises:
        HTTPException: If required claims are missing
    """
    if "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID (sub claim)"
        )
        
    if "email" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing email claim"
        )


def build_user_object(payload: dict) -> dict:
    """
    Extract user information from verified JWT payload
    
    Args:
        payload: Decoded and validated JWT payload
        
    Returns:
        Dictionary with user information
    """
    return {
        "id": payload["sub"],
        "email": payload["email"],
        "role": payload.get("role", "authenticated"),
        "aud": payload.get("aud", "authenticated")
    }


def verify_supabase_jwt(token: str) -> dict:
    """
    Verify Supabase-issued JWT token
    
    Args:
        token: JWT token string from Authorization header
        
    Returns:
        Decoded JWT payload containing user information
        
    Raises:
        HTTPException: If token is invalid, expired, or malformed
        
    Reference:
    - https://supabase.com/docs/guides/auth/server-side/verifying-jwts
    - https://supabase.com/docs/guides/auth/server-side
    """
    try:
        # Step 1: Decode token
        payload = decode_token(token)
        
        # Step 2: Validate required claims
        validate_claims(payload)
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> AuthUser:
    """
    FastAPI dependency to extract and verify current authenticated user
    
    Usage in endpoints:
        @app.get("/protected")
        async def protected_route(user: AuthUser = Depends(get_current_user)):
            return {"user_id": user.id, "email": user.email}
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        AuthUser object containing verified user information
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    payload = verify_supabase_jwt(token)
    user_data = build_user_object(payload)
    
    # Build AuthUser from extracted data
    return AuthUser(**user_data)


def get_user_id_from_token(token: str) -> str:
    """
    Extract user ID from Supabase JWT without FastAPI dependency
    
    Useful for scenarios where you need just the user ID
    
    Args:
        token: JWT token string
        
    Returns:
        User UUID as string
        
    Raises:
        HTTPException: If token is invalid
    """
    payload = verify_supabase_jwt(token)
    return payload["sub"]


# Optional: User profile model if you need to fetch additional user data
class UserProfile(BaseModel):
    """Extended user profile from Supabase auth.users table"""
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None
    
    class Config:
        frozen = True
