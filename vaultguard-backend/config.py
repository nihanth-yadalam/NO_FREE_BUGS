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
