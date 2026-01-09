import os
from dotenv import load_dotenv

load_dotenv()

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
SECRET_KEY = os.getenv("SECRET_KEY", "vaultguard-super-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# Demo User Credentials
DEMO_USER_EMAIL = os.getenv("DEMO_USER_EMAIL", "rahul.sharma@email.com")
DEMO_USER_PASSWORD = os.getenv("DEMO_USER_PASSWORD", "vaultguard123")
