var server = require('./server.js'); 
var routes = ['category'];
var serviceName = "categories";
server.start(serviceName, routes);