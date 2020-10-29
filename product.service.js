var server = require('./server.js'); 
var routes = ['product'];
var serviceName = "product";
server.start(serviceName, routes);