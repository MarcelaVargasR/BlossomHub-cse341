const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const connectDB = require("./utils/db")

const app = express();
connectDB()
dotenv.config();

// Middleware for parsing JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "VERY_SECRET_STRING", //TO DO: REPLACE FOR SOMETHING ELSE
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Z-Key"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  next();
});

// API Routes - Only mount the ones you want active
app.use("/api", routes);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      passReqToCallback: true,
    },
    function (req, accessToken, refreshToken, profile, done) {
      try {
        
        return done(null, profile);
      } catch (error) {
        console.error("there was an error in the strategy", error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("BlossomHub API is running!");
});

// Centralized error handling middleware (always keep this last)
app.use(errorHandler);

module.exports = { app };
