var server = require('./server.js'); 
var routes = ['delivery'];
var serviceName = "delivery";
server.start(serviceName, routes);