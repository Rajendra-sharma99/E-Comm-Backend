const express = require('express');
const cors = require('cors');
require('./db/config');
const User = require('./db/user');
const Product = require('./db/product');

const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/', (req, res) => {
    res.send("API Working Fine ✅");
});

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

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ result: "Invalid credentials" });
        }

        const user = await User.findOne({ email, password }).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "1h" }, (err, token) => {
                if (err) {
                    return res.status(500).send({ result: "Token generation failed" });
                }
                res.send({ user, auth: token });
            });
        } else {
            res.status(404).send({ result: "User not found" });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/add-product", verifyToken, async (req, res) => {
    try {
        let product = new Product(req.body);
        let result = await product.save();
        res.send(result);
    } catch (err) {
        console.error("Add product error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/products", verifyToken, async (req, res) => {
    try {
        const products = await Product.find();
        res.send(products.length ? products : { result: "No Product found" });
    } catch (err) {
        console.error("Fetch products error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.delete("/product/:id", verifyToken, async (req, res) => {
    try {
        const result = await Product.deleteOne({ _id: req.params.id });
        res.send(result);
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/product/:id", verifyToken, async (req, res) => {
    try {
        const result = await Product.findOne({ _id: req.params.id });
        res.send(result || { result: "No Record Found" });
    } catch (err) {
        console.error("Find product error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.put("/product/:id", verifyToken, async (req, res) => {
    try {
        const result = await Product.updateOne({ _id: req.params.id }, { $set: req.body });
        res.send(result);
    } catch (err) {
        console.error("Update product error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/search/:key", verifyToken, async (req, res) => {
    try {
        const result = await Product.find({
            $or: [
                { name: { $regex: req.params.key, $options: "i" } },
                { company: { $regex: req.params.key, $options: "i" } },
                { categry: { $regex: req.params.key, $options: "i" } },
                { price: { $regex: req.params.key, $options: "i" } }
            ]
        });
        res.send(result);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/profile", verifyToken, async (req, res) => {
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
        token = token.split(' ')[1];
        Jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                return res.status(401).send("Please provide a valid token");
            } else {
                next();
            }
        });
    } else {
        res.status(403).send("Access denied. Token missing");
    }
}

const port = 5000;
app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
