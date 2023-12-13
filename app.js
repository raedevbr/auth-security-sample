//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Raul Araujo is the newest milionaire from Brazil.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
    .then(user => {
        done(null, user);
    })
    .catch(err => {
        done(err, null);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
(accessToken, refreshToken, profile, cb) => {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, (err, user) => { 
        return cb(err, user);
    });
}
));

app.get('/', async (req, res) => {
    try {
        res.render('home');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/secrets');
    });

app.route('/login')
.get(async (req, res) => {
    try {
        res.render('login');
    } catch (err) {
        res.status(500).send(err);
    }
})

.post(passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/login'
}));


app.route('/register')
.get(async (req, res) => {
    try {
        res.render('register');
    } catch (err) {
        res.status(500).send(err);
    }
})

.post(async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await User.register({ username: username }, password);
        req.login(user, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            } else {
                res.redirect('/secrets');
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

app.route('/secrets')
.get(async (req, res) => {
    try {
        if (req.isAuthenticated()) {
            res.render('secrets');
        } else {
            res.redirect('/login');
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});


app.listen(3000, () => {
    console.log("Server started on port 3000.");
});