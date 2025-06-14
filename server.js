const dotenv = require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose')
const app = require('./app');
const connectDB = require('./utils/db.js'); // Corrected path

const PORT = process.env.PORT || 5500; // Use port from .env or default to 5000

// Connect to MongoDB
connectDB();

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});