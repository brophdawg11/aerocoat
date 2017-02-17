var express = require('express'),
    path = require('path'),
    app = express(),
    dir = path.join(__dirname, '..', '..', 'output/'),
    port = 8000;

console.log('Starting web server at ' + dir);
console.log('Visit http://localhost:8000/ in your web browser to test the site');
app.use(express.static(dir));
app.listen(port);
