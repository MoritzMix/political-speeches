"use strict";

const express = require('express')
const https = require('https');
const http = require('http');

const app = express()
const port_http = 4000;
const port_https = 5000;

require('./routes')(app);

const options = {                                     
}

//Mock URLs
app.use(express.static('public'));

https
  .createServer(options, app)
  .listen(port_https , ()=>{
    console.log(`https listening on port ${port_https}`)
});

http
    .createServer(app)
  .listen(port_http , ()=>{
    console.log(`http listening on port ${port_http}`)
  });
