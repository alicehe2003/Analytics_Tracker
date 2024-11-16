require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy; 
const bcrypt = require('bcryptjs');
const indexRouter = require('./routes/index');  
const pool = require("./db");  // Import from db.js

// Passport setup
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
            const user = rows[0];

            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

// Google OAuth strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CLIENT_CALLBACK,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const { id: googleId } = profile;
                const existingUser = await pool.query("SELECT * FROM users WHERE googleId = $1", [googleId]);

                if (existingUser.rows.length > 0) {
                    // If user exists, update the access token
                    const user = existingUser.rows[0];
                    await pool.query(
                        "UPDATE users SET accessToken = $1 WHERE id = $2",
                        [accessToken, user.id]
                    );
                    return done(null, user);
                } else {
                    // If user doesn't exist, create a new record
                    const newUser = await pool.query(
                        "INSERT INTO users (googleId, accessToken) VALUES ($1, $2) RETURNING *",
                        [googleId, accessToken]
                    );
                    return done(null, newUser.rows[0]);
                }
            } catch (err) {
                return done(err);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = rows[0];
        done(null, user);
    } catch (err) {
        done(err);
    }
});

const app = express();
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// Middleware to check if the user is authenticated
app.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false, 
    cookie: { secure: false }  // Set to true in production with HTTPS
}));

app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('styles'));

// Authentication routes for Google OAuth
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["https://www.googleapis.com/auth/youtube.readonly"] })
); 

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        // Successful authentication, redirect to analytics page 
        res.redirect("/analytics");
    }
);

// Use the routes defined in routes/index.js
app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express app listening on http://localhost:${PORT}!`));

