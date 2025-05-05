
const mongoose = require('mongoose');

// Local MongoDB
// mongoose.connect("mongodb://127.0.0.1:27017/e-comm");

// MongoDB Atlas Connection
mongoose.connect('mongodb+srv://rajendrasm99:iPxSJI6aOR9p6WEN@e-comm-dashboard.fd9ryux.mongodb.net/')
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));
