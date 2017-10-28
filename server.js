const express = require('express');
const app = express(); 

app.listen(process.env.PORT || 3000);
console.log('Server is running on port 3000');

// Use the public directory to host frontend files.
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.send("Hello world!");
})
