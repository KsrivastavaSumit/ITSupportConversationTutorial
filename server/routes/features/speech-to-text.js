/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
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

 const AuthorizationV1 = require('watson-developer-cloud/authorization/v1');
 const IamTokenManagerV1 = require('watson-developer-cloud/iam-token-manager/v1');

 module.exports = {
         initSpeechToText : function(config,req,res) {
         ProcessSTT(config,req,res,processSTTResponse);
 }
}// exports


var ProcessSTT = function (config,req,res,next) {

  // Create the token manager
  let tokenManager;
  const serviceUrl = process.env.url || 'https://stream.watsonplatform.net/speech-to-text/api';
  console.log(serviceUrl);
  if (process.env.SPEECH_TO_TEXT_IAM_APIKEY && process.env.SPEECH_TO_TEXT_IAM_APIKEY !== '') {
    tokenManager = new IamTokenManagerV1.IamTokenManagerV1({
      iamApikey: process.env.SPEECH_TO_TEXT_IAM_APIKEY || '<iam_apikey>',
      iamUrl: process.env.SPEECH_TO_TEXT_IAM_URL || 'https://iam.bluemix.net/identity/token',
    });
  } else {
    tokenManager = new AuthorizationV1({
      username: process.env.SPEECH_TO_TEXT_USERNAME || '<username>',
      password: process.env.SPEECH_TO_TEXT_PASSWORD || '<password>',
      url: serviceUrl,
    });
    console.log("going through username password");
  }
  // Inform user that TTS is not configured properly or at all
  if (!process.env.SPEECH_TO_TEXT_USERNAME && !process.env.SPEECH_TO_TEXT_IAM_APIKEY) {
    // eslint-disable-next-line
    console.warn('WARNING: The app has not been configured with a SPEECH_TO_TEXT_USERNAME and/or ' +
      'a SPEECH_TO_TEXT_IAM_APIKEY environment variable. If you wish to have text to speech ' +
      'in your working application, please refer to the https://github.com/watson-developer-cloud/car-dashboard ' +
      'README documentation on how to set these variables.');
  }

    tokenManager.getToken( (err, token) => {
      console.log("get token");
      if (err) {
        console.log('error:', err);
        console.log('Please refer to the https://github.com/watson-developer-cloud/car-dashboard\n' +
          'README documentation on how to set username and password or iam_apikey variables.');
        next(config,res,{'Error':'An error has occured in obtaining token from IBM Watson'});
      } else {
        next(config,res,token);
      }
    });
};

var processSTTResponse = function(config,res,response){
    if (config.debug) {console.log(" BASE <<< "+JSON.stringify(response,null,2));} //
    if (response.Error !== undefined) {
        res.status(500).send(response);
    } else {
        res.status(200).send(response);
    }
}
