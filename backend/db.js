const mongoose = require('mongoose');
// const mongoURI = 'mongodb+srv://spdvldixit2003:xPQDjWlr46YkcxpT@anvidigitalhub.4r7gf.mongodb.net/?retryWrites=true&w=majority&appName=AnviDigitalHub';
const mongoURI ='mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.7';


const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process on failure
    }
};

module.exports = connectToMongo;