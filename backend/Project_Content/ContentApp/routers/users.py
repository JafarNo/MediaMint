from typing import Annotated
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from .auth import get_current_user
from passlib.context import CryptContext

# Firebase imports
from ..firebase_db import UserDB

router = APIRouter(
    prefix='/user',
    tags=['user']
)

user_dependency = Annotated[dict, Depends(get_current_user)]
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


class UserVerification(BaseModel):
    password: str
    new_password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    first_name: str = None
    last_name: str = None
    email: str = None


@router.get('/', status_code=status.HTTP_200_OK)
async def get_user(user: user_dependency):
    """Get current user profile"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    user_data = UserDB.get_by_id(user.get('id'))
    if not user_data:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Remove sensitive data before returning
    user_data.pop('hashed_password', None)
    return user_data


@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(user: user_dependency, user_verification: UserVerification):
    """Change user password"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    user_data = UserDB.get_by_id(user.get('id'))
    if not user_data:
        raise HTTPException(status_code=404, detail='User not found')

    if not bcrypt_context.verify(user_verification.password, user_data.get('hashed_password', '')):
        raise HTTPException(status_code=401, detail='Error on password change')
    
    UserDB.update(user.get('id'), {
        'hashed_password': bcrypt_context.hash(user_verification.new_password)
    })


@router.put("/phonenumber/{phone_number}", status_code=status.HTTP_204_NO_CONTENT)
async def change_phonenumber(user: user_dependency, phone_number: str):
    """Update user phone number"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    UserDB.update(user.get('id'), {'phone_number': phone_number})


@router.put("/profile", status_code=status.HTTP_200_OK)
async def update_profile(user: user_dependency, user_update: UserUpdate):
    """Update user profile"""
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication Failed')
    
    update_data = {}
    if user_update.first_name:
        update_data['first_name'] = user_update.first_name
    if user_update.last_name:
        update_data['last_name'] = user_update.last_name
    if user_update.email:
        # Check if email is already taken by another user
        existing = UserDB.get_by_email(user_update.email)
        if existing and existing.get('id') != user.get('id'):
            raise HTTPException(status_code=400, detail='Email already in use')
        update_data['email'] = user_update.email
    
    if update_data:
        UserDB.update(user.get('id'), update_data)
    
    # Return updated user data
    updated_user = UserDB.get_by_id(user.get('id'))
    updated_user.pop('hashed_password', None)
    return updated_user






