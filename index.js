
const express = require('express');
const cors = require('cors');
require('./db/config');
const User = require('./db/user');
const Product = require('./db/product');

const Jwt = require('jsonwebtoken')
const jwtKey = 'e-comm'

const app = express();

app.use(express.json());
app.use(cors());


// Database connecting
// const connectDB = async()=> {
//     mongoose.connect("mongodb://127.0.0.1:27017/e-comm");
//     const productSchema = new mongoose.Schema({});
//     const product = mongoose.model("users", productSchema);
//     const data = await product.find();
//     console.log(data);

// }
// connectDB();

app.get('/', (req, res) => {
    res.send("Hi This is Test Get Api");
})


// User Registration Api
app.post("/register", async (req, res) => {
    console.log(req.body);
    try {
        const { email } = req.body;
        // Check if the email already exists
        const existingUser = await User.findOne({ email: email }).exec();

        if (existingUser) {
            return res.status(400).send("Email address already exists");
        }

        // Create a new user instance
        let user = new User(req.body);

        // Save the new user to the database
        await user.save();

        // Remove password from the user object for security reasons
        const result = user.toObject();
        delete result.password;



        // Return success response
        // res.status(200).json({ message: "Registration successful", user: result });

        Jwt.sign({ result }, jwtKey, { expiresIn: "1h" }, (err, token) => {
            if (err) {
                res.status(500).json({ error: "Something went wrong, please try again later" });
            } else {
                res.status(200).json({
                    message: "Registration successful",
                    user: result, // Assuming `result` contains user details
                    auth: token
                });
            }
        });


    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// User Login Api
app.post("/login", async (req, res) => {
    console.log(req.body);
    try {

        if (req.body.password && req.body.email) {
            let user = await User.findOne(req.body).select("-password");   // .select("-Password") This has use for remove password to display User

            if (user) {
                Jwt.sign({ user }, jwtKey, { expiresIn: "1h" }, (err, token) => {
                    if (err) {
                        console.error("Error signing JWT:", err);
                        return res.status(500).send({ result: "Internal server error" });
                    }
                    res.status(200).send({ user, auth: token });
                });
            } else {
                res.status(404).send({ result: "User not found" });
            }

        }
        else {
            res.send({ result: "Invalid Email and password entry" });
        }

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send("Internal Server Error");
    }
})




// New Product Addition Api
app.post("/add-product", verifyToken, async (req, res) => {
    try {
        let product = new Product(req.body);
        let result = await product.save();
        console.log("Product saved successfully:", result);
        res.send(result);
    } catch (error) {
        console.error("Error saving product:", error);
        res.status(500).send("Internal Server Error");
    }
});
 

// Show all Product Api
app.get("/products", verifyToken, async (req, res) => {
    try {
        const products = await Product.find();
        if (products.length > 0) {
            res.send(products)
        } else {
            res.send({ result: "No Product found" })
        }
    }
    catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Delete Product Api
app.delete("/product/:id", verifyToken,  async (req, res) => {
    try {
        let result = await Product.deleteOne({ _id: req.params.id });
        res.send(result)
    }
    catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send("Internal Server Error");
    }
});



// Search Id API
app.get("/product/:id", verifyToken, async (req, res) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        res.send(result)
    } else {
        res.send({ "result": "No Record Found." })
    }
})


app.put("/product/:id", verifyToken, async (req, res) => {
    console.log(req.body);
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    res.send(result)
});


// Search Api for searching product, name, etc
app.get("/search/:key", verifyToken, async (req, res) => {
    const key = req.params.key;
    try {
        const result = await Product.find({
            $or: [
                { name: { $regex: key, $options: 'i' } },
                { company: { $regex: key, $options: 'i' } },
                { categry: { $regex: key, $options: 'i' } },
                { price: { $regex: key, $options: 'i' } }
            ]
        });
        res.send(result);
    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).send("Error searching products");
    }
});


// Show all Registered user 
app.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.find();
        if (user.length > 0) {
            res.send(user)
        } else {
            res.send({ result: "No User found" })
        }
    }
    catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Middileware for Verification
function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    
    if (token) {
        token = token.split(' ')[1];
        console.log("middileware if called", token);

        Jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                res.send("please provide valid token")
            } else {
                next();
            }
        })

    } else {
        res.send("Please add token with header");
    }
    console.log("middileware is called", token);
    // next();
}


// Start server
let port = 5000;
app.listen(port, () => {
    console.log(`app is running on port ${port}`);
})