var server = require('./server.js'); 
var routes = ['order'];
var serviceName = "order";
server.start(serviceName, routes);