var http = require('http')
  , events = require('events')
  , util = require('util')
  , path = require('path')
  , fs = require('fs')
  ;
/**
* trackedMetrics is an object with eventTypes as keys and metrics object as values.
* This server will print the object upon request.  The user should update the metrics
* as normal within their application.
*/
var Server = module.exports = function Server(port, trackedMetrics) {
  var self = this;
  this.trackedMetrics = trackedMetrics || {};
  this.server = http.createServer(function (req, res) {
    if (req.url.match(/^\/metrics/)) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      var metricsObj = {};
      for (namespace in self.trackedMetrics) {
        metricsObj[namespace] = {};
        for (event in self.trackedMetrics[namespace]) {
          metricsObj[namespace][event] = self.trackedMetrics[namespace][event].printObj();
        }
      }
      res.end(JSON.stringify(metricsObj));
      return;
    } 
    if (req.url === '/' || req.url === '/index.html') {
      res.statusCode = 200
      res.setHeader('content-type', 'text/html')
      fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res)
      return;
    }
    if (req.url.slice(0, '/static'.length) === '/static') {
      res.statusCode = 200
      res.setHeader('content-type', 'text/javascript')
      fs.createReadStream(path.join(__dirname, req.url.slice(1))).pipe(res)
      return;
    }
  })
  if (port) {
    this.listen(port, "127.0.0.1");  
  }
}
util.inherits(Server, events.EventEmitter)

Server.prototype.addMetric = function(eventName, metric) {
  var namespaces = eventName.split('.')
    , event = namespaces.pop()
    , namespace = namespaces.join('.')
    ;
  if (!this.trackedMetrics[namespace]) {
    this.trackedMetrics[namespace] = {};
  }
  if(!this.trackedMetrics[namespace][event]) {
    this.trackedMetrics[namespace][event] = metric;
  }
}

Server.prototype.listen = function () {
  var self = this;
  self.server.listen.apply(self.server, arguments);
} 


