import os
import secrets
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Bank API Configuration
BANK_API_URL = os.getenv("BANK_API_URL", "http://bank-api:3100")

# User Configuration
DEFAULT_ACCOUNT_NUMBER = os.getenv("DEFAULT_ACCOUNT_NUMBER", "1234567890")
DEFAULT_IFSC_CODE = os.getenv("DEFAULT_IFSC_CODE", "VAULT001")

# User Profile
USER_NAME = os.getenv("USER_NAME", "Rahul Sharma")
USER_EMAIL = os.getenv("USER_EMAIL", "rahul.sharma@email.com")
BANK_NAME = os.getenv("BANK_NAME", "VaultGuard Bank")

# Authentication Configuration
_secret_key_env = os.getenv("SECRET_KEY")
if not _secret_key_env:
    logger.warning(
        "SECRET_KEY environment variable is not set! "
        "Generating a random key. This will invalidate all tokens on restart. "
        "Please set a secure SECRET_KEY in production."
    )
    SECRET_KEY = secrets.token_urlsafe(64)
else:
    SECRET_KEY = _secret_key_env

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# Demo User Credentials
DEMO_USER_EMAIL = os.getenv("DEMO_USER_EMAIL", "rahul.sharma@email.com")
DEMO_USER_PASSWORD = os.getenv("DEMO_USER_PASSWORD", "vaultguard123")
