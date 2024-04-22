
const express = require('express');
const cors = require('cors');
require('./db/config');
const User = require('./db/user');
const Product = require('./db/product');
const app = express();

app.use(express.json());
app.use(cors());

// const connectDB = async()=> {
//     mongoose.connect("mongodb://127.0.0.1:27017/e-comm");
//     const productSchema = new mongoose.Schema({});
//     const product = mongoose.model("users", productSchema);
//     const data = await product.find();
//     console.log(data);

// }
// connectDB();




// User Registration Api
app.post("/register", async (req, res) => {
    console.log(req.body);
    try {
        let user = new User(req.body);
        let result = await user.save();

        // we will delete password from user view for security Reson
        result = result.toObject();
        delete result.password;

        res.send(result);
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send("Internal Server Error");
    }
});

// User Login Api
app.post("/login", async (req, res) => {
    console.log(req.body);
    try {

        if (req.body.password && req.body.email) {
            let user = await User.findOne(req.body).select("-password");   // .select("-Password") This has use for remove password to display User
            if (user)
                res.send(user);
            else
                res.send({ result: "No user found" });
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
app.post("/add-product", async (req, res) => {
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
app.get("/products", async (req, res) => {
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
app.delete("/product/:id", async (req, res) => {
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
app.get("/product/:id", async (req, res) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        res.send(result)
    } else {
        res.send({ "result": "No Record Found." })
    }
})


app.put("/product/:id", async (req, res) => {
    console.log(req.body);
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    res.send(result)
});


 // Search Api for searching product, name, etc
 app.get("/search/:key", async (req, res) => {
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
app.get("/profile", async (req, res) => {
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



// Start server
let port = 5000;
app.listen(port, () => {
    console.log(`app is running on port ${port}`);
})