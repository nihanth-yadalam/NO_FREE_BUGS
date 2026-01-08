const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Deterministic Random Generator
 * Ensures that the same userId always gets the same transaction history.
 */
const seedRandom = (seed) => {
    let value = seed;
    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
};

const generateHistory = (userId) => {
    // Convert string userId to a numeric seed
    const numSeed = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const random = seedRandom(numSeed);

    const transactions = [];
    const now = new Date();

    // Generate 180 days of data
    for (let i = 180; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);

        // 1. Simulate Income (Volatile)
        // Gig workers often get paid in irregular lumps
        if (random() > 0.95) { // ~3 times a month
            const amount = Math.floor(random() * 1500) + 500;
            transactions.push({
                id: `tx-inc-${i}`,
                date: date.toISOString(),
                              amount: amount,
                              category: 'Income',
                              description: 'Freelance Payout / Gig Settlement',
                              type: 'credit'
            });
        }

        // 2. Simulate Fixed Expenses (Rent/Bills)
        if (date.getDate() === 1) {
            transactions.push({
                id: `tx-rent-${i}`,
                date: date.toISOString(),
                              amount: -1200,
                              category: 'Housing',
                              description: 'Monthly Rent Payment',
                              type: 'debit'
            });
        }

        // 3. Simulate Variable Daily Expenses
        if (random() > 0.4) {
            const amount = -(Math.floor(random() * 80) + 5);
            transactions.push({
                id: `tx-exp-${i}`,
                date: date.toISOString(),
                              amount: amount,
                              category: 'General',
                              description: random() > 0.5 ? 'Grocery Store' : 'Coffee / Dining',
                              type: 'debit'
            });
        }
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// --- Routes ---

// Health Check
app.get('/health', (req, res) => res.send({ status: 'Bank System Operational' }));

// Get Transactions for a User
app.get('/accounts/:userId/transactions', (req, res) => {
    const { userId } = req.params;
    const history = generateHistory(userId);

    // Calculate current balance based on history
    const balance = history.reduce((acc, curr) => acc + curr.amount, 1000); // Start with $1000 baseline

    res.json({
        userId,
        accountNumber: `****${userId.slice(-4) || '9999'}`,
             currency: 'USD',
             currentBalance: parseFloat(balance.toFixed(2)),
             transactions: history
    });
});

app.listen(PORT, () => {
    console.log(`Simulated Bank API running on port ${PORT}`);
});
