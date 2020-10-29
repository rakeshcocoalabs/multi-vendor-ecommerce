var server = require('./server.js'); 
var routes = ['feedback'];
var serviceName = "feedback";
server.start(serviceName, routes);