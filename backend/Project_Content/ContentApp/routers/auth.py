from datetime import timedelta, datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from starlette import status
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from fastapi.templating import Jinja2Templates
import secrets
import uuid

# Firebase imports
from ..firebase_db import UserDB, RefreshTokenDB, PasswordResetTokenDB
from ..config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix='/auth',
    tags=['auth']
)

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')


class CreateUserRequest(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str
    role: str
    phone_number: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenWithRefresh(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


templates = Jinja2Templates(directory="ContentApp/templates")


### Pages ###

@router.get("/login-page")
def render_login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/register-page")
def render_register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})


### Helper Functions ###

def authenticate_user(username: str, password: str):
    """Authenticate user with Firebase"""
    user = UserDB.get_by_username(username)
    if not user:
        return False
    if not bcrypt_context.verify(password, user.get('hashed_password', '')):
        return False
    return user


def create_access_token(username: str, user_id: str, role: str, expires_delta: timedelta):
    """Create JWT access token"""
    encode = {'sub': username, 'id': user_id, 'role': role}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token_for_user(user_id: str):
    """Create refresh token and store in Firebase"""
    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    RefreshTokenDB.create(user_id, token, expires_at)
    return token


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        user_id: str = payload.get('id')
        user_role: str = payload.get('role')
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail='Could not validate user.')
        return {'username': username, 'id': user_id, 'user_role': user_role}
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='Could not validate user.')


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(create_user_request: CreateUserRequest):
    """Register a new user"""
    # Check if username already exists
    existing_user = UserDB.get_by_username(create_user_request.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Username already exists.'
        )
    
    # Check if email already exists
    existing_email = UserDB.get_by_email(create_user_request.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email already registered.'
        )
    
    # Create user in Firebase
    user_data = {
        'email': create_user_request.email,
        'username': create_user_request.username,
        'first_name': create_user_request.first_name,
        'last_name': create_user_request.last_name,
        'role': create_user_request.role,
        'hashed_password': bcrypt_context.hash(create_user_request.password),
        'is_active': True,
        'phone_number': create_user_request.phone_number
    }
    
    UserDB.create(user_data)
    return {"message": "User created successfully"}


@router.post("/token", response_model=TokenWithRefresh)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """Login and get access token"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='Could not validate user.')
    
    access_token = create_access_token(
        user['username'], 
        user['id'], 
        user['role'], 
        timedelta(minutes=20)
    )
    refresh_token = create_refresh_token_for_user(user['id'])

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer'
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset"""
    user = UserDB.get_by_email(request.email)
    
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a reset link has been sent."}
    
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    PasswordResetTokenDB.create(request.email, reset_token, expires_at)
    
    # TODO: Send email with reset link containing the token
    # For now, we'll return the token (in production, send via email)
    
    return {
        "message": "If the email exists, a reset link has been sent.",
        "reset_token": reset_token  # Remove this in production
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token"""
    reset_token_data = PasswordResetTokenDB.get_by_token(request.token)
    
    if not reset_token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid or expired reset token.'
        )
    
    # Check if token is expired
    expires_at = reset_token_data.get('expires_at')
    if expires_at and expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Reset token has expired.'
        )
    
    user = UserDB.get_by_email(reset_token_data['email'])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.'
        )
    
    # Update password
    UserDB.update(user['id'], {
        'hashed_password': bcrypt_context.hash(request.new_password)
    })
    
    # Mark token as used
    PasswordResetTokenDB.mark_as_used(reset_token_data['id'])
    
    return {"message": "Password has been reset successfully."}


@router.post("/refresh", response_model=Token)
async def refresh_access_token(request: RefreshTokenRequest):
    """Refresh access token"""
    refresh_token_data = RefreshTokenDB.get_by_token(request.refresh_token)
    
    if not refresh_token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired refresh token.'
        )
    
    # Check if token is expired
    expires_at = refresh_token_data.get('expires_at')
    if expires_at and expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Refresh token has expired.'
        )
    
    user = UserDB.get_by_id(refresh_token_data['user_id'])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.'
        )
    
    new_access_token = create_access_token(
        user['username'],
        user['id'],
        user['role'],
        timedelta(minutes=20)
    )
    
    return {
        'access_token': new_access_token,
        'token_type': 'bearer'
    }







