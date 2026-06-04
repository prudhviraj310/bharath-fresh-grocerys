const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Enhanced database pool with a 5-second maximum connection timeout limit
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000
});

// Middleware to protect routes via JSON Web Tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access Denied" });

    jwt.verify(token, process.env.JWT_SECRET || 'BHARATH_SECRET_KEY', (err, user) => {
        if (err) return res.status(403).json({ error: "Session Expired" });
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION ROUTES ---

// Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPwd = await bcrypt.hash(password, 10);
        pool.query('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', [name, email, hashedPwd], (err) => {
            if (err) {
                console.error("❌ REGISTRATION DATABASE ERROR:", err.message);
                return res.status(500).json({ error: "Database registration failure", details: err.message });
            }
            res.json({ success: true });
        });
    } catch (cryptoErr) {
        console.error("❌ BCRYPT CRYPTO ERROR:", cryptoErr);
        res.status(500).json({ error: "Password encryption failed" });
    }
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        // Look here: If the database engine drops the query, we log it directly to PowerShell!
        if (err) {
            console.error("❌ CRITICAL LOGIN DATABASE ERROR:", err);
            return res.status(500).json({ error: "Internal Database Connection Error", details: err.message });
        }
        
        if (results.length === 0) {
            return res.status(400).json({ error: "User non-existent" });
        }

        const user = results[0];
        try {
            const passValid = await bcrypt.compare(password, user.password_hash);
            if (!passValid) return res.status(400).json({ error: "Invalid Credentials" });

            const token = jwt.sign(
                { id: user.id, name: user.full_name }, 
                process.env.JWT_SECRET || 'BHARATH_SECRET_KEY', 
                { expiresIn: '12h' }
            );
            res.json({ token, user: { name: user.full_name, email: user.email } });
        } catch (authErr) {
            console.error("❌ AUTH ENCRYPTION VERIFICATION ERROR:", authErr);
            res.status(500).json({ error: "Authentication processing error" });
        }
    });
});

// --- SHOPPING INVENTORY & CART ROUTES ---

// Fetch All Products Grid
app.get('/api/products', (req, res) => {
    pool.query('SELECT * FROM products', (err, results) => {
        if (err) {
            console.error("❌ FETCH PRODUCTS DATABASE ERROR:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// View Shopping Cart Details
app.get('/api/cart', authenticateToken, (req, res) => {
    pool.query(
        'SELECT c.id, p.name, p.price, c.quantity, p.image_url FROM carts c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', 
        [req.user.id], 
        (err, results) => {
            if (err) {
                console.error("❌ FETCH CART DATABASE ERROR:", err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// Add Item to Shopping Cart Line
app.post('/api/cart/add', authenticateToken, (req, res) => {
    const { product_id, quantity } = req.body;
    pool.query(
        'INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?', 
        [req.user.id, product_id, quantity, quantity], 
        (err) => {
            if (err) {
                console.error("❌ ADD TO CART DATABASE ERROR:", err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true });
        }
    );
});

app.listen(5000, () => console.log('Enterprise API Routing operational on engine port 5000'));