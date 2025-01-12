const axios = require("axios");
const express = require("express");
const router = express.Router();
const User = require("../models/users");




// Image proxy for rendering third party images
// Endpoint to fetch the user image
router.get("/image-proxy", async (req, res) => {
    const imageUrl = req.query.url; // Expect the image URL as a query parameter
    if (!imageUrl) {
        return res.status(400).send("No image URL provided");
    }
    
    try {
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
        res.set("Content-Type", "image/jpeg"); // Set the correct image MIME type
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).send("Error fetching the image");
    }
});


// Verify is username is available
router.get("/username-available", async (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.json({ available: false });
    }
    
    try {
        // Check if the username is available
        const user = await User.findOne({ username}); // Find a user with the given username
        if (user) {
            return res.json({ available: false });
        }
        return res.json({ available: true });
    } catch (error) {
        console.error("Error checking username availability:", error);
        // res.status(500).send("Error checking username availability");
        return res.json({ available: false });
    }
});


// validating username with not incqluding special characters and spaces
router.get("/validate-username", async (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.json({ valid: false });
    }
    if (username.match(/^[a-zA-Z0-9_]+$/)) {
        return res.json({ valid: true });
    } else {
        return res.json({ valid: false });
    }
});


module.exports = router;