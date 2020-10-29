var server = require('./server.js'); 
var routes = ['adminOrder'];
var serviceName = "adminOrder";
server.start(serviceName, routes);