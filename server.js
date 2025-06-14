const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes/index");

const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api", routes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("BlossomHub API is running!");
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;