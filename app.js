//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = "Thisisourlittlesecret.";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password']});

const User = new mongoose.model('User', userSchema);

app.route('/')
.get(async (req, res) => {
    try {
        res.render('home');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.route('/login')
.get(async (req, res) => {
    try {
        res.render('login');
    } catch (err) {
        res.status(500).send(err);
    }
})

.post(async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const existingUser = await User.findOne({email: email});

        if (!existingUser) {
            return res.status(404).json({ message: "User not found."});
        }

        if (password === existingUser.password) {
            res.render('secrets');
        } else {
            return res.status(401).json({ message: "Invalid credentials."});
        }

    } catch (err) {
        res.status(500).send(err);
    }
});


app.route('/register')
.get(async (req, res) => {
    try {
        res.render('register');
    } catch (err) {
        res.status(500).send(err);
    }
})

.post(async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const newUser = new User({email, password});
        await newUser.save();
        res.render('secrets');
    } catch (err) {
        res.status(500).send(err);
    }
});


app.listen(3000, () => {
    console.log("Server started on port 3000.");
});