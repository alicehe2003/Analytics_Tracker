const express = require("express");
const passport = require("passport");
const { fetchInstagramAnalytics, fetchYouTubeAnalytics } = require("../services/analyticsService");

const router = express.Router();

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

// Route to fetch analytics from API calls and pass to analytics.ejs 
router.get("/analytics", ensureAuthenticated, async (req, res, next) => {
    try {
        // Assuming req.user contains the access token from Google OAuth
        const accessToken = req.user.accessToken;
        
        // List of YouTube video IDs to fetch analytics for
        const youtubeVideoIds = ["video_id_here"];
        
        const youtubeData = await Promise.all(
            youtubeVideoIds.map(videoId => fetchYouTubeAnalytics(accessToken, videoId))
        );

        res.render("analytics", { user: req.user, analyticsData: youtubeData });
    } catch (err) {
        next(err); 
    }
}); 

module.exports = router;
