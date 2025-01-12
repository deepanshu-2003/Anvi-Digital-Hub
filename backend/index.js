const express = require('express');
const app = express();
const cors = require('cors');
const port = 5000;
const bcrypt = require("bcryptjs");
const axios = require("axios");
const connectToMongo = require('./db');

// Importing the User model
const User = require('./models/users');

// Connecting to MongoDB
connectToMongo();

// Middleware
app.use(express.json());
app.use(cors());







// Importing routes
app.use('/auth', require('./routes/auth'));
app.use('/course', require('./routes/course'));
app.use('/general', require('./routes/general'));

// Default admin creation function
const createDefaultAdmin = async () => {
    try {
        const adminUsername = "admin";
        const adminEmail = "admin@anvidigitalhub.com";
        const adminPassword = "admin@123";
        const adminMobile = "1234567890";

        // Check if the admin user already exists
        const existingAdmin = await User.findOne({ type: "admin" });
        if (existingAdmin) {
            console.log("Default admin user already exists.");
            return;
        }

        // Hash the admin password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create the admin user
        await User.create({
            first_name: "Admin",
            last_name: "User",
            username: adminUsername,
            email: adminEmail,
            type: "admin",
            password: hashedPassword,
            mobile: adminMobile,
        });

        console.log("Default admin user created successfully.");
    } catch (error) {
        console.error("An error occurred while creating the default admin user:", error.message);
    }
};

// Call the function to create the default admin user
createDefaultAdmin();

// Start the Express server
app.listen(port, () => {
    console.log(`Anvi Digital Hub Backend is listening on Port ${port}`);
});
