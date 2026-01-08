const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Connection using Environment Variables for Docker compatibility
const pool = new Pool({
    user: process.env.DB_USER || 'bank_user',
    host: process.env.DB_HOST || 'bank-db',
    database: process.env.DB_NAME || 'bank_db',
    password: process.env.DB_PASSWORD || 'bank_password',
    port: 5432,
});

// 1. Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Bank API is operational' });
});

// 2. Get All Users (New Endpoint)
app.get('/getallusers', async (req, res) => {
    try {
        const result = await pool.query('SELECT account_number, ifsc_code, balance FROM accounts ORDER BY id ASC');
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
            'SELECT account_number, ifsc_code, balance FROM accounts WHERE account_number = $1 AND ifsc_code = $2',
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
    const { initial_balance } = req.body;
    try {
        await pool.query(
            'INSERT INTO accounts (account_number, ifsc_code, balance) VALUES ($1, $2, $3)',
                         [acc, ifsc, initial_balance || 0]
        );
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(400).json({ error: 'User already exists or database error' });
    }
});

// 6. Delete User (and their transactions)
app.delete('/deleteuser/:acc/:ifsc', async (req, res) => {
    const { acc, ifsc } = req.params;
    try {
        // Delete all transactions for this account first
        await pool.query(
            'DELETE FROM transactions WHERE sender_account = $1 OR receiver_account = $1',
            [acc]
        );
        // Then delete the account
        const result = await pool.query('DELETE FROM accounts WHERE account_number = $1 AND ifsc_code = $2', [acc, ifsc]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User and transactions deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Deposit (Atomic)
app.post('/deposit/:acc/:ifsc/:amount', async (req, res) => {
    const { acc, ifsc, amount } = req.params;
    const { timestamp } = req.body; // Optional custom timestamp
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updateRes = await client.query(
            'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2 AND ifsc_code = $3',
            [amount, acc, ifsc]
        );
        if (updateRes.rowCount === 0) throw new Error('Account not found');

        if (timestamp) {
            await client.query(
                'INSERT INTO transactions (sender_account, receiver_account, amount, timestamp) VALUES ($1, $2, $3, $4)',
                               ['EXTERNAL_DEPOSIT', acc, amount, timestamp]
            );
        } else {
            await client.query(
                'INSERT INTO transactions (sender_account, receiver_account, amount) VALUES ($1, $2, $3)',
                               ['EXTERNAL_DEPOSIT', acc, amount]
            );
        }
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
    const { timestamp } = req.body; // Optional custom timestamp
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
        if (timestamp) {
            await client.query(
                'INSERT INTO transactions (sender_account, receiver_account, amount, timestamp) VALUES ($1, $2, $3, $4)',
                               [acc, 'CASH_WITHDRAWAL', amount, timestamp]
            );
        } else {
            await client.query(
                'INSERT INTO transactions (sender_account, receiver_account, amount) VALUES ($1, $2, $3)',
                               [acc, 'CASH_WITHDRAWAL', amount]
            );
        }
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
