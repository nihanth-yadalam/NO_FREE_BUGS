const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Connection using Environment Variables for Docker compatibility
const pool = new Pool({
    user: process.env.DB_USER || 'bank_user',
    host: process.env.DB_HOST || 'bank-db',
    database: process.env.DB_NAME || 'bank_db',
    password: process.env.DB_PASSWORD || 'bank_password',
    port: 5432,
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// 1. Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Bank API is operational' });
});

// Auth endpoints
app.post('/auth/signup', async (req, res) => {
    const { email, password, account_number, ifsc_code } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO accounts (account_number, ifsc_code, email, password_hash) VALUES ($1, $2, $3, $4)',
            [account_number, ifsc_code, email, hashedPassword]
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: 'User already exists or database error' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM accounts WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, account_number: user.account_number }, JWT_SECRET);
        res.json({ token, user: { id: user.id, email: user.email, account_number: user.account_number, ifsc_code: user.ifsc_code, balance: user.balance } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/auth/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, account_number, ifsc_code, balance FROM accounts WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get All Users (New Endpoint)
app.get('/getallusers', async (req, res) => {
    try {
        const result = await pool.query('SELECT account_number, ifsc_code, balance, email FROM accounts ORDER BY id ASC');
        res.json({ count: result.rowCount, users: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Specific User Details
app.get('/getuser/:acc/:ifsc', async (req, res) => {
    const { acc, ifsc } = req.params;
    try {
        const result = await pool.query(
            'SELECT account_number, ifsc_code, balance, email FROM accounts WHERE account_number = $1 AND ifsc_code = $2',
            [acc, ifsc]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get Transactions with Dynamic Filters
// Usage: /gettransaction/12345/BANK001/date?value=2024-05-20
app.get('/gettransaction/:acc/:ifsc/:filter', async (req, res) => {
    const { acc, ifsc, filter } = req.params;
    const { value } = req.query;

    let query = 'SELECT * FROM transactions WHERE (sender_account = $1 OR receiver_account = $1)';
    let params = [acc];

    if (filter === 'date' && value) {
        params.push(value);
        query += ` AND timestamp::date = $${params.length}`;
    } else if (filter === 'amount' && value) {
        params.push(value);
        query += ` AND amount >= $${params.length}`;
    } else if (filter === 'time' && value) {
        params.push(value);
        query += ` AND timestamp::time >= $${params.length}`;
    }
    // 'alltime' requires no additional filters

    try {
        const result = await pool.query(query, params);
        res.json({ filter_used: filter, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Add User
app.post('/adduser/:acc/:ifsc', async (req, res) => {
    const { acc, ifsc } = req.params;
    const { initial_balance, email, password } = req.body;
    try {
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        await pool.query(
            'INSERT INTO accounts (account_number, ifsc_code, balance, email, password_hash) VALUES ($1, $2, $3, $4, $5)',
                         [acc, ifsc, initial_balance || 0, email, hashedPassword]
        );
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(400).json({ error: 'User already exists or database error' });
    }
});

// 6. Delete User
app.delete('/deleteuser/:acc/:ifsc', async (req, res) => {
    const { acc, ifsc } = req.params;
    try {
        const result = await pool.query('DELETE FROM accounts WHERE account_number = $1 AND ifsc_code = $2', [acc, ifsc]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Deposit (Atomic)
app.post('/deposit/:acc/:ifsc/:amount', async (req, res) => {
    const { acc, ifsc, amount } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updateRes = await client.query(
            'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2 AND ifsc_code = $3',
            [amount, acc, ifsc]
        );
        if (updateRes.rowCount === 0) throw new Error('Account not found');

        await client.query(
            'INSERT INTO transactions (sender_account, receiver_account, amount) VALUES ($1, $2, $3)',
                           ['EXTERNAL_DEPOSIT', acc, amount]
        );
        await client.query('COMMIT');
        res.json({ message: 'Deposit successful' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally { client.release(); }
});

// 8. Withdraw (Atomic with Balance Check)
app.post('/withdraw/:acc/:ifsc/:amount', async (req, res) => {
    const { acc, ifsc, amount } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const user = await client.query(
            'SELECT balance FROM accounts WHERE account_number = $1 AND ifsc_code = $2 FOR UPDATE',
            [acc, ifsc]
        );

        if (user.rows.length === 0) throw new Error('Account not found');
        if (parseFloat(user.rows[0].balance) < parseFloat(amount)) throw new Error('Insufficient funds');

        await client.query('UPDATE accounts SET balance = balance - $1 WHERE account_number = $2', [amount, acc]);
        await client.query(
            'INSERT INTO transactions (sender_account, receiver_account, amount) VALUES ($1, $2, $3)',
                           [acc, 'CASH_WITHDRAWAL', amount]
        );
        await client.query('COMMIT');
        res.json({ message: 'Withdrawal successful' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally { client.release(); }
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bank API running on port ${PORT}`);
});
