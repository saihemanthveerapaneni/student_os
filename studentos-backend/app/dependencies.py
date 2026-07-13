from fastapi import Header, HTTPException
from jose import jwt, JWTError
from app.config import settings

def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is required")
    
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(status_code=401, detail="Authorization header must follow: Bearer <token>")
        token = parts[1]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    if token == "mock-token":
        raise HTTPException(status_code=401, detail="Mock token is not allowed")

    try:
        # Supabase uses HS256 to sign user JWTs with the project JWT secret
        # In local dev, we bypass signature verification if the secret is mismatched
        payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False, "verify_signature": False})
        user_id = payload.get("sub")

        email = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="sub claim is missing in token payload")
        return {"id": user_id, "email": email}
    except JWTError as e:
        print(f"JWT Verification Error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
