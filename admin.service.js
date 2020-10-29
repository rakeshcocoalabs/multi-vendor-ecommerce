var server = require('./server.js'); 
var routes = ['admin'];
var serviceName = "admin";
server.start(serviceName, routes);