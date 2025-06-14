require('dotenv').config(); // Load environment variables at the very top

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const passport = require('passport'); // <<< ADD THIS IMPORT
const cors = require('cors'); // <<< ADD THIS IMPORT
const fs = require("fs");

const swaggerSpec = require("./utils/swagger");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require('./utils/connectDB'); // <<< ADD THIS IMPORT
const apiRoutes = require("./routes/index"); // Renamed for clarity, implies it aggregates all API routes

const app = express();

// Connect to Database
connectDB(); // <<< CALL THE DATABASE CONNECTION FUNCTION

// Passport config (ensure it's initialized before routes that use it)
require('./config/passport')(passport);
app.use(passport.initialize());
// If you use sessions with Passport, also add:
 app.use(passport.session()); // Only if using session-based auth (less common with pure JWT)

// Core Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data

// API Routes
// This `apiRoutes` should be the main aggregator that includes ALL your other route files
// (categories, flowers, auth, users, wishlists, orders)
app.use("/api", apiRoutes);

// Swagger UI - Make sure BASE_URL is set in .env
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
fs.writeFileSync("./swagger.json", JSON.stringify(swaggerSpec, null, 2));
console.log("swagger.json has been saved!");

// Health check endpoint
app.get("/", (req, res) => {
    res.send("BlossomHub API is running!");
});

// Centralized error handling middleware (always keep this last)
app.use(errorHandler);

module.exports = app;