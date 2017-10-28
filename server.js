// Include dependencies.
const express = require('express');
const bodyParser = require('body-parser');
const expressHandlebars = require('express-handlebars');
const passwordHash = require('password-hash');
const mongoose = require('mongoose');
const app = express(); 
var session = require('express-session');

// Run the app on port 3000. 
app.listen(process.env.PORT || 3000);
console.log('Server is running on port 3000');

// Connect to local mongodb instance. 
mongoose.connect('mongodb://localhost:27017');

// Define User and Asset schemas and models for Mongoose.
var transactionSchema = new mongoose.Schema({
  name : {type : String, default: 'Bitcoin'},
  tag : {type : String, default: 'BTC'},
  price: {type : Number, default: 0},
  quantity: {type : Number, default: 0},
  buy: {type : Boolean, default: true}
});

var assetSchema = new mongoose.Schema({
  name : {type : String, default: 'Bitcoin'},
  tag : {type : String, default: 'BTC'},
  price: {type : Number, default: 0},
  quantity: {type : Number, default: 0}
});

var userSchema = new mongoose.Schema({
  username: {type : String, default: ''},
  password: {type : String, default: ''},
  transactions: {type : [Transaction], default: ''},
  assets: {type : [Asset], default: ''},
  liquidAssets: {type: Number, default: '10000'},
  netWorth: {type: Number, default: '10000'}
});

var Transaction = mongoose.model('Transaction', transactionSchema);
var Asset = mongoose.model('Asset', assetSchema);
var User = mongoose.model('User', userSchema);

// Configure the session variable.
app.use(session({secret: 'zQWNr3Pj_!!842CDN'}));

// Set up body parsing for form input.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set the templating engine to Handlebars.
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Use the public directory to host frontend files.
app.use(express.static(__dirname + '/public'));

// Use the views directory to host Handlebar views.
app.set('/views', __dirname + '/views');

// Serve the home page.
app.get('/', function(req, res) {
  res.render('index', { title: "Home" });
});

// Serve the login page.
app.get('/login', function(req, res) {
  if (req.session.user && req.session.auth)
    res.redirect("/user/" + req.session.user._id);
  else
    res.render("login", { title: "Log In"});
});

// Serve the signup page.
app.get('/signup', function(req, res) {
  res.render('signup', { title: "Sign Up" });
})

// Handle a login request.
app.post('/login', function(req, res) {
  User.findOne({ 'username' : req.body.username }, function(err, user) {
    if (!user)
      res.render("login", { error: "No user with that username exists!" });
    else if (err) 
      res.render("login", { error: err });
    else if (passwordHash.verify(req.body.password, user.password)) {
      req.session.user = user;
      req.session.auth = true;
      res.render("user", { user : user });
    } else {
      res.render("login", { error: "Incorrect password." });
    }
  });
});

// Handle a signup request.
app.post('/signup', function(req, res) {
  var user = new User(req.body);
  user.password = passwordHash.generate(req.body.password);
  User.findOne({ "username" : req.body.username }, function(err, data) {
    if (data)
      res.render("signup", { title: "Sign Up", error : "A user with that username address already exists!" });
    else {
      user.save(function(err, data) {
        if (err)
          res.send(err);
        res.render("login", { title: "Successful Sign Up", message: "Please log in with your new credentials." });
      });
    }
  });
});

// API for getting and updating current user's Liquid Assets quantity
app.post('/api/liquidAssets', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  req.session.user.liquidAssets = req.liquidAssets; 
  User.findOne({ username: req.session.user.username }, function(err, data) {
    if (err)
      res.status(500).send(err);
    data.liquidAssets = req.session.user.liquidAssets;
    data.save(function(err, data) {
      if (err)
        res.status(500).send(err);
      res.send("Successfully updated.");
    })
  });
}); 

app.get('/api/liquidAssets', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  req.send({ liquidAssets: req.session.user.liquidAssets });
}); 

// API for getting and updating current user's transactions history
app.post('/api/transactions', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  req.session.user.transactions.push(req.transaction);
  User.findOne({ username: req.session.user.username }, function(err, data) {
    if (err)
      res.status(500).send(err);
    data.transactions = req.session.user.transactions;
    data.save(function(err, data) {
      if (err)
        res.status(500).send(err);
      res.send("Successfully updated.");
    })
  });
});

app.get('/api/transactions', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  res.send({ transactions: req.session.user.transactions });
})

// API for getting and updating current user's assets list
app.post('/api/assets', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  req.session.user.assets = req.assets;
  User.findOne({ username: req.session.user.username }, function(err, data) {
    if (err)
      res.status(500).send(err);
    data.assets = req.session.user.assets;
    data.save(function(err, data) {
      if (err)
        res.status(500).send(err);
      res.send("Successfully updated.");
    })
  });
});

app.get('/api/assets', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  res.send({ assets: req.session.user.assets });
});
