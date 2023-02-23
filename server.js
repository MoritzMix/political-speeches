"use strict";

const express = require('express')
const http = require('http');

const app = express()
const port_http = 4000;

require('./routes')(app);

//Mock URLs
app.use(express.static('public'));


http
  .createServer(app)
  .listen(port_http, () => {
    console.log(`http listening on port ${port_http}`)
  });
