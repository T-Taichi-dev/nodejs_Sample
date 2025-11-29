const express = require('express')
const pool = require('./db')

const app = express();
const PORT = 3002;


app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.send(`PostgreSQL Connected! Server time: ${result.rows[0].now}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database connection failed');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});