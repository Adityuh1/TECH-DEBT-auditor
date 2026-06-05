require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Global middleware
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
    res.send('Automated Tech-Debt Auditor API is running!');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Audit repository endpoint (POST stub)
app.post('/api/audit', async (req, res) => {
    const { repoUrl, gitToken } = req.body;

    if (!repoUrl) {
        return res.status(400).json({ error: 'Repository URL (repoUrl) is required.' });
    }

    console.log(`📥 Received audit request for URL: ${repoUrl}`);
    if (gitToken) {
        console.log(`🔑 GitHub token provided (will be used for private authentication)`);
    }

    // Return static stub response for validation
    res.json({
        message: 'Audit initiated successfully (STUB)',
        repoUrl,
        findingsCount: 0,
        findings: []
    });
});


// Boot the server
app.listen(PORT, () => {
    console.log(`🚀 Auditor Server listening on http://localhost:${PORT}`);
});
