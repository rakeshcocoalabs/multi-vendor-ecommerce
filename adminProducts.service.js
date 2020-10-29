var server = require('./server.js'); 
var routes = ['adminProducts'];
var serviceName = "adminProducts";
server.start(serviceName, routes);