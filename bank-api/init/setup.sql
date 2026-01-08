CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255)
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    sender_account VARCHAR(20),
    receiver_account VARCHAR(20),
    amount DECIMAL(15, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
