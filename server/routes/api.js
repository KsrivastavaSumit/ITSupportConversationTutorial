/**
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
const express = require('express');
const conversation = require('./features/conversation');
const claim = require('./features/claim');
const STT = require('./features/speech-to-text');
const TTS = require('./features/text-to-speech')
var fs = require('fs');
var  claimmodel = require('../model/claim.json');
var  attachmentmodel = require('../model/attachment.json');
var  diarymodel = require('../model/diary.json');
var url  = require('url');

const AssistantV1 = require('watson-developer-cloud/assistant/v1'); // watson sdk
//var slacklisterner = require('./features/slack-listener');
/* commentiing on 09-04-2018 as we are getting en arror*/
var assistant = new AssistantV1({
  version: '2018-07-16'  /*earlier we were using 2018-02-16*/
});

var showAllLogs = (process.env.show_all_logs === 'true');
var receiverEmailAddress = process.env.receiver_email_address;
var senderEmailAddress = process.env.sender_email_address;
var senderEmailPassword = process.env.sender_email_password;

const updateMessage = (input,response) => {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  }
    else
    {
      return response;
    }

  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
};
/*Car DB end*/

/** Export the APIs for the front end */
module.exports = function(app,config) {
  /* GET api listing. */
  app.get('/', (req, res) => {
    res.send('API supported: GET /api; POST /api/conversation; ');
  });

  app.post('/api/message', (req, res, next) => {
    console.log("mesg received");
    const workspace = process.env.WORKSPACE_ID || '<workspace-id>';
    if (!workspace || workspace === '<workspace-id>') {
      return res.json({
        output: {
          text: 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
            '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> ' +
            'documentation on how to set this variable. <br>' +
            'Once a workspace has been defined the intents may be imported from ' +
            '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> ' +
            'in order to get a working application.'
        }
      });
    }

    const payload = {
      workspace_id: workspace,
      context: req.body.context || {},
      input: req.body.input || {}
    };
    console.log(req.body.context);
    console.log(req.body.input);
    console.log(JSON.stringify( payload));
  // Send the input to the conversation service
  assistant.message(payload, (error, data) => {
    if (error) {
      console.log(error);
      return next(error);
    }
    console.log("context::" + data.context);
    if(data.context.Action=="createFNOLinSOR")
    {
        console.log("Create FNOL in SOR");
        claim.sendClaimDirect(data,config,claimmodel, (error,data) =>
        {
          if (error) {
            console.log(error);
            return next(error);
          }
              console.log("retun of claimDirect");
              console.log(data);
              return res.json(data);
        });
    }
    else
        return res.json(updateMessage(payload,data));
  });
});

  // Support REST call
  app.post('/api/conversation',function(req,res){
      if(!req.body){
        res.status(400).send({error:'no post body'});
      } else {
        if (req.body.context.type !== undefined && req.body.context.type == "sodb") {
          conversation.sobdConversation(config,req,res);
        } else {
          conversation.itSupportConversation(config,req,res);
        }
      }
  });
  app.post('/api/advisor',function(req,res){
      if(!req.body){
        res.status(400).send({error:'no post body'});
      } else {
          conversation.advisor(config,req,res);
        }
  });

  // Support REST call to rmA
  app.post('/api/claim',function(req,res){
      if(!req.body){
        res.status(400).send({error:'no post body'});
      } else {
            claim.createFNOLinSOR(config,claimmodel,req,res);

            //asynchronously do a diary as well
        }
      });
    app.post('/api/attachment/events/:eventId/:eventNumber',function(req,res){
        if(!req.body){
          res.status(400).send({error:'no post body'});
        } else {
              attachmentmodel.attachRecordId = req.params.eventId;
              diarymodel.attachRecordid = req.params.eventId;
              diarymodel.entryName ="Watson Event : " +req.params.eventNumber;
              claim.createDocinSOR(config,attachmentmodel,req,res);
              //stillthinking where to keep this
              claim.createDiaryinSOR(config,diarymodel,req,res);
          }
        });

      app.get('/api/speech-to-text/token',function(req,res){
            console.log("got it");
            STT.initSpeechToText(config,req,res);
          });

      app.get('/api/text-to-speech/token',function(req,res){
            TTS.initTextToSpeech(config,req,res);
          });

      app.get("/api/callSOE", function (request, response) {
           console.log("SOE get called");
           commonGetPostCall(request, response);
      });

      app.post("/api/callSOE", function (request, response) {
        console.log("SOE post called");
      	commonGetPostCall(request, response);
      });

      function commonGetPostCall(request, response) {
      	var responseString = "";
      	var reqBody = request.body;
      	console.log("VGW to WCS, data passed through SOE is -- ");
      	//if (showAllLogs){
      		console.log(JSON.stringify(reqBody));
      	//}
      	//else if (!showAllLogs){
      		console.log(JSON.stringify(reqBody.input.text, null, 2));
      	//}

      	reqBody.workspace_id = process.env.wcs_workspace;

      	assistant.message(reqBody, function(err, response2) {
      		if (err) {
      			responseString += err;
            console.log("An error: " + err);
      		}
      		else {
      			var modifiedJson = editResponse(response2);
      			responseString += JSON.stringify(modifiedJson, null, 2);
      			//if (!showAllLogs){
              console.log("We are here after modified");
              console.log(JSON.stringify(modifiedJson.output.text, null, 2));
      			//}
      		}
      		console.log("2. WCS to VGW, data passed through SOE is -- ");
      		//if (showAllLogs){
      			console.log(responseString);
      		//}
      		response.end(responseString);
      	});
      }

      // change the response in this function
      function editResponse(completeResponse){
      	var newArray = completeResponse.output.text;
      	var changedArray = [];

      	// change Prosody Rate for making TTS slow
      	for (var i = 0; i < newArray.length; i++) {
      		changedArray.push('<prosody rate="-9%">'+newArray[i]+'</prosody>');
      	}

      	var defaultVGW = [
      		{
      			"command": "vgwActUnPauseSTT"
      		},
      		{
      			"command": "vgwActPlayText"
      		}
      		];

      	// if vgwActionSequence not in response, push the default one
      	if (!completeResponse.output.hasOwnProperty("vgwActionSequence")){
      		completeResponse.output.vgwActionSequence = defaultVGW;
          console.log("doesnt have property")
      	}

      	completeResponse.output.text = changedArray;
        console.log("not triggeirng amail yet");
        //triggerMail(completeResponse);
      	return completeResponse;
      }

      // code for sending mail if entities detected
function triggerMail(completeResponse) {

	var triggerMail = false;

	if (completeResponse.hasOwnProperty("intents")) {
		var intents = completeResponse.intents;
		triggerMail = true;
	}

	if (triggerMail) {
		var nodemailer = require('nodemailer');
		var transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: senderEmailAddress,
				pass: senderEmailPassword
			}
		});
		var mailOptions1 = {
				from: senderEmailAddress,
				to: receiverEmailAddress,
				subject: 'Intent detected in Conversation',
				text: 'This mail is to notify detection of Intent in Conversation.'
		};
		transporter.sendMail(mailOptions1, function(error, info){
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);
			}
		});
	}
}

/****************This whole section can go away as it is there to support Browser Audio which is mot smooth to show****/
  app.get('/audioworks/css/*', (req, res) => {
     var url_parts = (url.parse(req.url)).path.split('/');
     var filename = url_parts[url_parts.length-1];
     var dirname = url_parts[url_parts.length-2];

    fs.readFile("server/audioworks/" + dirname + '/' + filename, function (error, pgResp)
    {
      if (error) {
          res.writeHead(404);
          res.write('Contents you are looking are Not Found' + error);

      } else {
          res.writeHead(200, { 'Content-Type': 'text/css' });
          res.write(pgResp);
      }
      res.end();
    });;
  });
  app.get('/audioworks/fonts/medium/*', (req, res) => {
     var url_parts = (url.parse(req.url)).path.split('/');
     var filename = url_parts[url_parts.length-1];
     var dirname = url_parts[url_parts.length-2];
    fs.readFile("server/audioworks/fonts/" + dirname + '/' + filename, function (error, pgResp)
    {
      if (error) {
          res.writeHead(404);
          res.write('Contents you are looking are Not Found' + error);

      } else {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.write(pgResp);
      }
      res.end();
    });;
  });
  app.get('/audioworks/fonts/roman/*', (req, res) => {
     var url_parts = (url.parse(req.url)).path.split('/');
     var filename = url_parts[url_parts.length-1];
     var dirname = url_parts[url_parts.length-2];
    fs.readFile("server/audioworks/fonts/" + dirname + '/' + filename, function (error, pgResp)
    {
      if (error) {
          res.writeHead(404);
          res.write('Contents you are looking are Not Found' + error);

      } else {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.write(pgResp);
      }
      res.end();
    });;
  });
  app.get('/audioworks/fonts/*', (req, res) => {
     var url_parts = (url.parse(req.url)).path.split('/');
     var filename = url_parts[url_parts.length-1];
     var dirname = url_parts[url_parts.length-2];
    fs.readFile("server/audioworks/" + dirname + '/' + filename, function (error, pgResp)
    {
      if (error) {
          res.writeHead(404);
          res.write('Contents you are looking are Not Found' + error);

      } else {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.write(pgResp);
      }
      res.end();
    });;
  });


  app.get('/audioworks/js/libs/*', (req, res) => {
     var url_parts = (url.parse(req.url)).path.split('/');
     var filename = url_parts[url_parts.length-1];
     var dirname = url_parts[url_parts.length-2];
    fs.readFile("server/audioworks/js/" + dirname + '/' + filename, function (error, pgResp)
    {
      if (error) {
          res.writeHead(404);
          res.write('Contents you are looking are Not Found' + error);

      } else {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.write(pgResp);
      }
      res.end();
    });;
  });
  app.get('/audioworks/js/*', (req, res) => {
     var url_parts = (url.parse(req.url)).path.split('/');
     var filename = url_parts[url_parts.length-1];
     var dirname = url_parts[url_parts.length-2];

    fs.readFile("server/audioworks/" + dirname + '/' + filename, function (error, pgResp)
    {
      if (error) {
          res.writeHead(404);
          res.write('Contents you are looking are Not Found' + error);

      } else {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.write(pgResp);
      }
      res.end();
    });;
  });
  app.get('/audioworks/ibm/*', (req, res) => {
     var url_parts = (url.parse(req.url)).path.split('/');
     var filename = url_parts[url_parts.length-1];
     var dirname = url_parts[url_parts.length-2];

    fs.readFile("server/audioworks/" + dirname + '/' + filename, function (error, pgResp)
    {
      if (error) {
          res.writeHead(404);
          res.write('Contents you are looking are Not Found' + error);

      } else {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.write(pgResp);
      }
      res.end();
    });;
  });

  app.get('/audioworks/images/*', (req, res) => {
     var url_parts = (url.parse(req.url)).path.split('/');
     var filename = url_parts[url_parts.length-1];
     var dirname = url_parts[url_parts.length-2];

    fs.readFile("server/audioworks/" + dirname + '/' + filename, function (error, pgResp)
    {
      if (error) {
          res.writeHead(404);
          res.write('Contents you are looking are Not Found' + error);

      } else {
          res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
          res.write(pgResp);
      }
      res.end();
    });;
  });

  app.get('/audioworks', (req,res)=>{
      fs.readFile("server/audioworks/audioworks.html", function (error, pgResp) {
          if (error) {
              res.writeHead(404);
              res.write('Contents you are looking are Not Found' + error);

          } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.write(pgResp);
          }
          res.end();
      });
  });
/****************This whole section can go away as it is there to support Browser Audio which is mot smooth to show****/

} // exports
