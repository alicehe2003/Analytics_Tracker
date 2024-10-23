const { Pool } = require("pg");
const express = require("express"); 
const session = require("express-session"); 
const passport = require("passport"); 
const LocalStrategy = require('passport-local').Strategy; 
const bcrypt = require('bcryptjs'); 

const pool = new Pool({
    // PostgressSQL config 
}); 

// set up passport 
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
                // passwords do not match 
                return done(null, false, { message: "Incorrect password" }); 
            }
            return done(null, user); 
        } catch (err) {
            return done(err); 
        }
    })
); 

passport.serializeUser((user, done) => {
    done(null, user.id); 
}); 

passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]); 
        const user = rows[0]; 

        done(null, user); 
    } catch(err) {
        done(err); 
    }
}); 

const app = express(); 
app.set("views", __dirname + "/views"); 
app.set("view engine", "ejs"); 

// CHANGE LATER 
app.use(session({ secret: "cats", resave: false, saveUninitialized: false })); 
app.use(passport.session()); 
app.use(express.urlencoded({ extended: false })); 

app.get("/", (req, res) => {
    res.render("index", { user: req.user }); 
}); 

app.get("/sign-up", (req, res) => res.render("sign-up-form")); 

app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err); 
        }
        res.redirect("/"); 
    }); 
}); 

app.get("/settings", (req, res) => res.render("settings")); 

app.post("/sign-up", async (req, res, next) => {
    try {
        // hash password before saving 
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
            if (err) {
                return next(err); 
            }

            // store hashed password 
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

app.post(
    "/log-in", 
    passport.authenticate("local", {
        successRedirect: "/", 
        failureRedirect: "/"
    })
); 

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => console.log(`Express app listening on port http://localhost:${PORT}!`)); 
