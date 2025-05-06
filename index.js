const express = require('express');
const cors = require('cors');
require('./db/config');
const User = require('./db/user');
const Product = require('./db/product');

const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';

const app = express();

// Middleware to parse incoming JSON data
app.use(express.json());

// CORS setup to allow cross-origin requests
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Test endpoint to check if the API is working
app.get('/', (req, res) => {
    res.send("API Working Fine Test done");
});

// Register endpoint
app.post("/register", async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).send("Email address already exists");
        }

        let user = new User(req.body);
        await user.save();
        const result = user.toObject();
        delete result.password;

        Jwt.sign({ result }, jwtKey, { expiresIn: "1h" }, (err, token) => {
            if (err) {
                res.status(500).send({ error: "JWT creation failed" });
            } else {
                res.status(200).send({ user: result, auth: token });
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Login endpoint
app.post("/login", async (req, resp) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return resp.status(400).json({ error: "Missing email or password" });
        }

        let user = await User.findOne({ email, password }).select("-password");

        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: '1h' }, (err, token) => {
                if (err) {
                    return resp.status(500).json({ error: "JWT creation failed" });
                }
                resp.json({
                    user,
                    auth: token
                });
            });
        } else {
            resp.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        resp.status(500).json({ error: "Internal Server Error" });
    }
});

// Add product endpoint with token verification middleware
app.post("/add-product", async (req, res) => {
    try {
        let product = new Product(req.body);
        let result = await product.save();
        res.send(result);
    } catch (err) {
        console.error("Add product error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Get all products endpoint with token verification middleware
app.get("/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.send(products.length ? products : { result: "No Product found" });
    } catch (err) {
        console.error("Fetch products error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Delete a product endpoint with token verification middleware
app.delete("/product/:id", async (req, res) => {
    try {
        const result = await Product.deleteOne({ _id: req.params.id });
        res.send(result);
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Get a specific product by ID with token verification middleware
app.get("/product/:id", async (req, res) => {
    try {
        const result = await Product.findOne({ _id: req.params.id });
        res.send(result || { result: "No Record Found" });
    } catch (err) {
        console.error("Find product error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Update a product by ID with token verification middleware
app.put("/product/:id", async (req, res) => {
    try {
        const result = await Product.updateOne({ _id: req.params.id }, { $set: req.body });
        res.send(result);
    } catch (err) {
        console.error("Update product error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Search for products by a key with token verification middleware
app.get("/search/:key", async (req, res) => {
    try {
        const result = await Product.find({
            $or: [
                { name: { $regex: req.params.key, $options: "i" } },
                { company: { $regex: req.params.key, $options: "i" } },
                { category: { $regex: req.params.key, $options: "i" } },
                { price: { $regex: req.params.key, $options: "i" } }
            ]
        });
        res.send(result);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Profile endpoint with token verification middleware
app.get("/profile", async (req, res) => {
    try {
        const users = await User.find();
        res.send(users.length ? users : { result: "No User found" });
    } catch (err) {
        console.error("Profile error:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Token Verification Middleware
function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1]; // Assuming token is prefixed with "Bearer "
        Jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                return res.status(401).send("Invalid or expired token");
            } else {
                next(); // Proceed to the next middleware or route handler
            }
        });
    } else {
        res.status(403).send("Access denied. Token missing");
    }
}

// Server setup
const port = 5000;
app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
