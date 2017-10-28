// Include dependencies.
const express = require('express');
const expressHandlebars = require('express-handlebars');
const app = express(); 

// Run the app on port 3000. 
app.listen(process.env.PORT || 3000);
console.log('Server is running on port 3000');

// Set the templating engine to Handlebars.
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Use the public directory to host frontend files.
app.use(express.static(__dirname + '/public'));

// Use the views directory to host Handlebar views.
app.set('/views', __dirname + '/views');

// Serve the home page.
app.get('/', function(req, res) {
  res.render('index', { title: "Hello!" });
});
