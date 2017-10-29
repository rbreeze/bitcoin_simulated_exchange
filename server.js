/* **************
       Setup 
 ************** */

// Include dependencies.
const express = require('express');
const bodyParser = require('body-parser');
const expressHandlebars = require('express-handlebars');
const passwordHash = require('password-hash');
const mongoose = require('mongoose');
const request = require('request');
const async = require('async')
const app = express(); 
var session = require('express-session');

// Run the app on port 3000. 
app.listen(process.env.PORT || 3000);
console.log('Server is running on port 3000');

// Connect to local mongodb instance. 
mongoose.connect('mongodb://localhost:27017');

// Define coins to use.
var globalCoins =  {
  BTC: { 
    title: "Bitcoin",
    tag: "BTC"
  }, ETH: { 
    title: "Ethereum", 
    tag: "ETH" 
  }, XRP: {
    title: "Ripple",
    tag: "XRP"
  }, BCH: {
    title: "Bitcoin Cash",
    tag: "BCH"
  }, LTC: {
    title: "Litecoin",
    tag: "LTC"
  }, DASH: {
    title: "Dash",
    tag: "DASH"
  }, XEM: {
    title: "NEM",
    tag: "XEM"
  }, NEO: {
    title: "NEO",
    tag: "NEO"
  }, XMR: {
    title: "Monero",
    tag: "XMR"
  }, ETC: {
    title: "Ethereum Classic",
    tag: "ETC"
  }, ZEC: {
    title: "Zcash",
    tag: "ZEC"    
  }, XLM: {
    title: "StellarLumens",
    tag: "XLM"
  }, LSK: {
    title: "Lisk",
    tag: "LSK"
  }, STRAT: {
    title: "Stratis",
    tag: "STRAT"
  }, WAVES: {
    title: "Waves",
    tag: "WAVES"   
  }
}

var tags = ["BTC", "ETH", "XRP", "BCH", "LTC", "DASH", "XEM", "NEO", "XMR", "ETC", "ZEC", "XLM", "LSK", "STRAT", "WAVES"];

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
  quantity: {type : Number, default: 0}
});

var userSchema = new mongoose.Schema({
  username: {type : String, default: ''},
  password: {type : String, default: ''},
  transactions: {type : [Transaction], default: ''},
  assets: {type : [Asset], default: ''},
  liquidAssets: {type: Number, default: '10000'}
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

/* **************
       Routes 
 ************** */

// Serve the home page.
app.get('/', function(req, res) {
  res.render('index', { user: req.session.user, title: "Home" });
});

// Serve the login page.
app.get('/login', function(req, res) {
  console.log("Login: " + req.session.user);
  if (req.session.user != null)
    res.redirect("/user");
  else
    res.render("login", { title: "Log In"});
});

// Log Out method.
app.get('/logout', function(req, res) {
  req.session.destroy(); 
  res.redirect("/"); 
});

// Serve the signup page.
app.get('/signup', function(req, res) {
  res.render('signup', { title: "Sign Up" });
});

// Serve the charts page. 
app.get('/charts', function(req, res) {
  res.render('charts', { user: req.session.user, title: "Charts"});
})

// Serve a user profile page.
app.get('/user', function(req, res) {
  if (req.session.user) { 
    var urls = generateUrls(); 
    console.log("User: " + req.session.user);
    async.map(urls, function(url, callback) {
      request(url, function(err, response, body) {
          callback(err, body);
      })
    }, function(err, data){
      if(err) {
          return console.error(err);
      }
      var prices = [];
      for (var i = 0; i < tags.length; i++) {
        data[i] = JSON.parse(data[i]);
        prices.push(data[i].ticker.price);
        globalCoins[tags[i]].price = data[i].ticker.price;
      }
      // var netWorth = 0; 
      // for (var i = 0; i < req.session.user.assets.length; i++) {
      //   netWorth += req.session.user.assets[i].quantity * globalCoins[req.session.user.assets[i].tag].price; 
      // }
      // netWorth += req.session.user.liquidAssets; 
      res.render('user', { user: req.session.user, title: req.session.user.username, coins: globalCoins});
    });
  } else {
    res.redirect("/login");
  }
});

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
      req.session.save(function(err) {
        // session updated
        console.log("Login post: " +req.session);
        res.redirect('/user');
      });
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

/* **************
       API 
 ************** */


// Request to buy a cryptocurrency using user's liquid assets.
app.post('/api/buy', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  var url = getRequestURL(req.body.tag);
  request(url, function(err, response, data) {
    data = JSON.parse(data);
    req.body.quantity = parseFloat(req.body.quantity); 
    var curValue = parseFloat(req.body.quantity) * parseFloat(data.ticker.price);
    if (curValue <= req.session.user.liquidAssets) {
      var result = isOwned(req.body.tag, req.session.user.assets); 
      if (result.isOwned) {
        req.session.user.assets[result.index].quantity += req.body.quantity; 
      } else {
        req.session.user.assets.push({ tag: req.body.tag, name: globalCoins[req.body.tag].title, quantity: req.body.quantity });
      }
      req.session.user.liquidAssets -= curValue; 
      req.session.user.transactions.push({ name: globalCoins[req.body.tag].title, tag: req.body.tag, price: parseFloat(data.ticker.price), quantity: req.body.quantity, buy: true })

      User.findOne({ username: req.session.user.username }, function(err, curUserData) {
        if (result.isOwned)
          curUserData.assets[result.index].quantity = req.session.user.assets[result.index].quantity;
        else 
          curUserData.assets.push(req.session.user.assets[result.index]);
        curUserData.liquidAssets = Math.round(req.session.user.liquidAssets * 100) / 100;
        curUserData.transactions.push({ name: globalCoins[req.body.tag].title, tag: req.body.tag, price: parseFloat(data.ticker.price), quantity: parseFloat(req.body.quantity), buy: false });
        curUserData.save(function(err, data) {
          if (err)
            res.send(err);
          res.render("user", { user: req.session.user, title: req.session.user.username, message: "Successfully purchased " + req.body.quantity + " " + req.body.tag, coins: globalCoins });
        });
      });

    } else {
      res.render("user", { user: req.session.user, title: req.session.user.username, message: "Not enough money to buy the " + req.body.tag + " you requested.", coins: globalCoins });
    }

  });
});

// Request to sell an amount of user's owned cryptocurrency. 
app.post('/api/sell', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  var url = getRequestURL(req.body.tag);
  request(url, function(err, response, data) {
    data = JSON.parse(data);
    req.body.quantity = parseFloat(req.body.quantity); 
    var result = isOwned(req.body.tag, req.session.user.assets); 
    if (result.isOwned && req.session.user.assets[result.index].quantity >= req.body.quantity) {
      var curValue = parseFloat(data.ticker.price) * parseFloat(req.body.quantity); 
      req.session.user.assets[result.index].quantity -= req.body.quantity; 
      req.session.user.liquidAssets += curValue; 
      req.session.user.transactions.push({ name: globalCoins[req.body.tag].title, tag: req.body.tag, price: parseFloat(data.ticker.price), quantity: parseFloat(req.body.quantity), buy: false });

      User.findOne({ username: req.session.user.username }, function(err, curUserData) {
        curUserData.assets[result.index].quantity = req.session.user.assets[result.index].quantity;
        curUserData.liquidAssets = Math.round(req.session.user.liquidAssets * 100) / 100;
        curUserData.transactions.push({ name: globalCoins[req.body.tag].title, tag: req.body.tag, price: parseFloat(data.ticker.price), quantity: parseFloat(req.body.quantity), buy: false });
        curUserData.save(function(err, data) {
          if (err)
            res.send(err);
          res.render("user", { user: req.session.user, title: req.session.user.username, message: "Successfully sold " + req.body.quantity + " " + req.body.tag, coins: globalCoins });
        })
      });

    } else {
      res.render("user", { user: req.session.user, title: req.session.user.username, message: "Not enough " + req.body.tag + " to sell the quantity requested.", coins: globalCoins });
    }
  });
});

// Request to get user's net worth
app.get('/api/networth', function(req, res) {
  if (!req.session.user)
    res.send({ error: "No user is currently logged in." });
  res.response(getNetWorth(req));
});

// Helper function to generate URL for Cryptonator API
function getRequestURL(coinCode) {
  return "https://api.cryptonator.com/api/ticker/" + coinCode + "-USD";
}

// Helper function to check if user owns a coin
function isOwned(coinCode, assets) {
  var isOwnedBool = false;
  for(var i = 0; i < assets.length; i++) {
    if(assets[i].tag == coinCode && assets[i].quantity > 0) {
      isOwnedBool = true;
      break;
    }
  }
  return { isOwned: isOwnedBool, index: i };
}

function getNetWorth() {

}

function generateUrls() {
  var urls = [];
  for (var i = 0; i < tags.length; i++) {
    urls.push(getRequestURL(tags[i]));
  }
  return urls; 
}

