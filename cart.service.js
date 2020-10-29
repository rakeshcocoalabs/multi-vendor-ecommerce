var server = require('./server.js'); 
var routes = ['cart'];
var serviceName = "cart";
server.start(serviceName, routes);