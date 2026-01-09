"""
VaultGuard Authentication Module
Handles user authentication with JWT tokens
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt
import random
from pydantic import BaseModel

from config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    DEMO_USER_EMAIL,
    DEMO_USER_PASSWORD,
    USER_NAME,
    USER_EMAIL,
    DEFAULT_ACCOUNT_NUMBER,
    DEFAULT_IFSC_CODE
)

# Security
security = HTTPBearer()


# Models
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    password: str
    name: str


class User(BaseModel):
    email: str
    name: str
    account_number: str
    ifsc_code: str
    disabled: bool = False


class UserInDB(User):
    hashed_password: str


def generate_account_number() -> str:
    """Generate a random 10-digit account number (use generate_unique_account_number for uniqueness check)"""
    return ''.join([str(random.randint(0, 9)) for _ in range(10)])


async def generate_unique_account_number(bank_service, ifsc_code: str = "VAULT001", max_attempts: int = 10) -> str:
    """
    Generate a unique 10-digit account number that doesn't exist in the database.
    Checks against both local user database and Bank API.
    
    Args:
        bank_service: The bank API service instance for checking account existence
        ifsc_code: The IFSC code to use for checking (default: VAULT001)
        max_attempts: Maximum number of attempts to generate a unique number
    
    Returns:
        A unique account number string
    
    Raises:
        ValueError: If unable to generate unique account number after max_attempts
    """
    users_db = get_users_db()
    
    for _ in range(max_attempts):
        account_number = generate_account_number()
        
        # Check if account exists in local user database
        local_exists = any(
            user.account_number == account_number 
            for user in users_db.values()
        )
        
        if local_exists:
            continue
        
        # Check if account exists in Bank API
        bank_exists = await bank_service.account_exists(account_number, ifsc_code)
        
        if not bank_exists:
            return account_number
    
    raise ValueError(f"Unable to generate unique account number after {max_attempts} attempts")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# Pre-hash the demo password at module load time
_DEMO_PASSWORD_HASH = hash_password(DEMO_USER_PASSWORD)


# In-memory user database (for demo purposes)
# In production, this would be a real database
_users_db = {
    DEMO_USER_EMAIL: UserInDB(
        email=DEMO_USER_EMAIL,
        name=USER_NAME,
        account_number=DEFAULT_ACCOUNT_NUMBER,
        ifsc_code=DEFAULT_IFSC_CODE,
        hashed_password=_DEMO_PASSWORD_HASH,
        disabled=False
    )
}


def get_users_db():
    return _users_db


def add_user(email: str, name: str, hashed_password: str, account_number: str, ifsc_code: str) -> UserInDB:
    """Add a new user to the database"""
    if email in _users_db:
        raise ValueError("User already exists")
    user = UserInDB(
        email=email,
        name=name,
        account_number=account_number,
        ifsc_code=ifsc_code,
        hashed_password=hashed_password,
        disabled=False
    )
    _users_db[email] = user
    return user


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return hash_password(password)


def get_user(email: str) -> Optional[UserInDB]:
    """Get user from database by email"""
    users_db = get_users_db()
    if email in users_db:
        return users_db[email]
    return None


def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    """Authenticate user with email and password"""
    user = get_user(email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = get_user(email=token_data.email)
    if user is None:
        raise credentials_exception
    return User(
        email=user.email,
        name=user.name,
        account_number=user.account_number,
        ifsc_code=user.ifsc_code,
        disabled=user.disabled
    )


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active (non-disabled) user"""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
