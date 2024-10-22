const { Pool } = require("pg");
const express = require("express"); 
const session = require("express-session"); 
const passport = require("passport"); 
const LocalStrategy = require('passport-local').Strategy; 

const pool = new Pool({
    // PostgressSQL config 
}); 

const app = express(); 
app.set("views", __dirname); 
app.set("view engine", "ejs"); 

// CHANGE LATER 
app.use(session({ secret: "cats", resave: false, saveUninitialized: false })); 
app.use(passport.session()); 
app.use(express.urlencoded({ extended: false })); 

app.get("/", (req, res) => res.render("index")); 

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => console.log(`Express app listening on port http://localhost:${PORT}!`)); 
