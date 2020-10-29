var server = require('./server.js'); 
var routes = ['user'];
var serviceName = "user";
server.start(serviceName, routes);