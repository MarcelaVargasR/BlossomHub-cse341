const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User'); // Path to your User model
const { generateToken } = require('../utils/jwt'); // For JWT generation

module.exports = (passport) => {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                // User already exists, log them in
                done(null, user);
            } else {
                // Create a new user
                user = await User.create({
                    googleId: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value, // Get the primary email
                    profilePicture: profile.photos[0].value,
                    // isAdmin: false by default
                });
                done(null, user);
            }
        } catch (err) {
            console.error('Error during Google OAuth:', err.message);
            done(err, null);
        }
    }));

    // JWT Strategy
    const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
    };

    passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            const user = await User.findById(jwt_payload.id).select('-googleId'); // Exclude googleId for security

            if (user) {
                done(null, user); // User found
            } else {
                done(null, false); // User not found
            }
        } catch (err) {
            console.error('Error during JWT authentication:', err.message);
            done(err, false);
        }
    }));

    // Passport session setup (needed for traditional session management, but JWT is stateless)
    // For pure JWT, these aren't strictly necessary but good practice to include if mixing auth methods.
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};