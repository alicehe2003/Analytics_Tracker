const express = require("express");
const passport = require("passport");
const { fetchInstagramAnalytics, fetchYouTubeAnalytics } = require("../services/analyticsService");
const router = express.Router();
const bcrypt = require('bcryptjs');  
const pool = require("../db");

// route to start google auth 
router.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "https://www.googleapis.com/auth/youtube.readonly"],
}));

router.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/",
    }),
    (req, res) => {
        res.redirect("/analytics");
    }
);

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
}

// Home route
router.get("/", (req, res) => {
    res.render("index", { user: req.user });
});

// Sign-up form route
router.get("/sign-up", (req, res) => res.render("sign-up-form"));

// Log out route
router.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

// Settings route (only accessible if logged in)
router.get("/settings", ensureAuthenticated, (req, res) => {
    res.render("settings");
});

// Sign-up POST route
router.post("/sign-up", async (req, res, next) => {
    try {
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            if (err) {
                return next(err);
            }

            await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
                req.body.username,
                hashedPassword,
            ]);
            res.redirect("/");
        });
    } catch (err) {
        return next(err);
    }
});

// Log-in POST route using passport authentication
router.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/",
    })
);

// Middleware to ensure user is authenticated via Google OAuth
function ensureGoogleAuthenticated(req, res, next) {
    if (req.isAuthenticated() && req.user.accessToken) {
        return next();
    } else {
        // If not authenticated, redirect to Google OAuth flow
        res.redirect("/auth/google");
    }
}

// Analytics route to render the analytics page with form (GET request)
router.get("/analytics", ensureGoogleAuthenticated, (req, res) => {
    res.render("analytics", { 
        user: req.user, 
        analyticsData: [],
        error: null  // Initialize error as null
    });
});

// Route to fetch analytics for the specified video ID (POST request)
router.post("/analytics", ensureGoogleAuthenticated, async (req, res, next) => {
    const { videoId } = req.body;
    
    try {
        // Validate video ID
        if (!videoId) {
            throw new Error('Video ID is required');
        }
        
        // Fetch YouTube analytics for the provided video ID
        const accessToken = req.user.accessToken;
        const youtubeData = await fetchYouTubeAnalytics(accessToken, videoId);
        
        if (!youtubeData) {
            throw new Error('No data found for the provided video ID');
        }
        
        // Render the page with analytics data
        res.render("analytics", { 
            user: req.user, 
            analyticsData: [youtubeData],
            error: null  // No error when successful
        });
    } catch (err) {
        // Render the page with error message
        res.render("analytics", { 
            user: req.user, 
            analyticsData: [],
            error: err.message || 'An error occurred while fetching analytics'
        });
    }
});

module.exports = router;
