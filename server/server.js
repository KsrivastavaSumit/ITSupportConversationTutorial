/*
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Get dependencies
const express = require('express');
const path = require('path');

const http = require('http');
const https = require('https');
const privateKey = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};
// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

const bodyParser = require('body-parser');

const app = express();

// Parsers for POST JSON PAYLOAD
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(path.join(__dirname, '../dist')));

// Set specific api routes
var config = require('./config/config.json');
require('dotenv').config();
require('./routes/api')(app,config);

// Bootstrap application settings
require('./config/express')(app,config);
// error-handler settings
require('./config/error-handler')(app);


// Catch all other routes and return the index file
app.get('*', (req, res) => {
  console.log("audio");
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});


// start server on the specified port and binding host
const port = process.env.PORT || config.port;
app.listen(port, '0.0.0.0', function() {
  console.log("Conversation Broker Service "+ config.version+" starting on " + port);
  console.log("  Use your web browser: http://localhost:"+port);
});
