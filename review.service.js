var server = require('./server.js'); 
var routes = ['review'];
var serviceName = "review";
server.start(serviceName, routes);