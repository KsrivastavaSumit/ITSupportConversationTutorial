//Example POST method invocation
module.exports = {

        createFNOLinSOR : function(config,claimmodel,req,res) {
        sendClaim(config,claimmodel,req,res,processcreateFNOLinSORResponse);
 }, //createFNOLinSOR
        createDocinSOR:function(config,attachmentmodel,req,res) {
        sendDoc(config,attachmentmodel,req,res);
 } //createDoc

} // exports

// ------------------------------------------------------------
// Private
// ------------------------------------------------------------
var tConvert = function (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join (''); // return adjusted time or original string
}

var tConvertbyZone = function (time, timezone) {
var moment = require('moment-timezone');
var moments = require('moment');

  var format = 'hh:mm A';
   return moment(time, format).tz(timezone).format(format);
}

var getname = function (name) {
   var  namearray = name.split(" ");
   var  finalname =[];

   if (namearray.length >1)
   {
         finalname[0] =namearray[0];
         var remaining = namearray.slice(1);
         finalname[1] =remaining.join();
   }
   else {
        finalname[0] ="FNU";
        finalname[1] =namearray[0];
   }
   return finalname;
}

var sendClaim = function(config,claimmodel,req,res,next){
var moment = require('moment');
  if (config.debug) {
      console.log("--- Connect to System Of Record: " + config.SOR.systemname);
      console.log("---Reading the request " + req.body.context.PolicyNumber + " " + req.body.context.ReportingPerson);
  }

  var Client = require('node-rest-client').Client;
  var client = new Client();
  claimmodel.reporterEntity.zipCode=req.body.context.AddressZip;
  var originaltime = tConvert(req.body.context.TimeOfEvent);
  var convertedtimeOfEvent = tConvertbyZone(originaltime,config.SOR.servertimezone);

  var originaldateofevent =req.body.context.DateofEvent;
  if ((originaltime.indexOf('AM') >0 && convertedtimeOfEvent.indexOf('PM')>0) ||
  (originaltime.indexOf('PM') >0 && convertedtimeOfEvent.indexOf('AM')>0))
  {
        originaldateofevent = moment(originaldateofevent , "YYYY-MM-DD").subtract(1,'d').format("MM/DD/YYYY");
  }
  else
  {
        originaldateofevent = moment(originaldateofevent , "YYYY-MM-DD").format("MM/DD/YYYY");
  }


  claimmodel.timeOfEvent =convertedtimeOfEvent;
  claimmodel.dateOfEvent = originaldateofevent;
  claimmodel.dateReported = moment().format ('MM/DD/YYYY');
  console.log(convertedtimeOfEvent);
  console.log(originaldateofevent);
  console.log(claimmodel.timeOfEvent );

  claimmodel.timeReported =tConvertbyZone(tConvert(moment().format('hh:mm A')),config.SOR.servertimezone);
  claimmodel.reporterEntity.emailAddress =req.body.context.Email;
  claimmodel.reporterEntity.phone1 = req.body.context.PhoneNumber;
  var namearray = getname( req.body.context.ReportingPerson);
  claimmodel.reporterEntity.firstName =namearray[0];
  claimmodel.reporterEntity.lastName = namearray[1];
  claimmodel.reporterEntity.taxId = "0000-00-" +req.body.context.SSN;
  claimmodel.reporterEntity.comments = "Timezone of reporting person was offset by: " + req.body.context.UTCOffset;
  claimmodel.eventDescription = "PolicyNumber is " + req.body.context.PolicyNumber + ". Reported By: " +req.body.context.ReportingPerson  + ". Timezone of reporting person was offset by: " + req.body.context.UTCOffset;

  // set content-type header and data as json in args parameter
  var args = {
      data: claimmodel,
      headers: { "Content-Type": "application/json", "Authorization": config.SOR.claimtoken }
  }
  var eventId = 0;

  var req = client.post(config.SOR.claimapiurl, args, function(err, response) {
        if (err[0]) {
          console.log('error:', JSON.stringify(err,null,1).substring(0,120));
          next(config,res,{'Error': err[0].message + ". Error with rmA. Please contact your administrator"});
        }
        else {
          next(config,res,{'eventNumber':err.eventNumber,'eventId':err.eventId});
        }
  });
  req.on('requestTimeout', function (req) {
      console.log('request has expired');
      req.abort();
  });

  req.on('responseTimeout', function (res) {
      console.log('response has expired');
  });

  //it's usefull to handle request errors to avoid, for example, socket hang up errors on request timeouts
  req.on('error', function (err) {
      console.log('request error', err);
      next(config,res,{'Error': "Communication error with rmA. Please contact your administrator"});
  });

} // sendClaim

var sendDoc = function(config,attachmentmodel,req,res){
  var moment = require('moment');
  var fs = require("fs");

  var Client = require('node-rest-client').Client;

  var client = new Client();
  var args = {
      data: attachmentmodel,
      headers: { "Content-Type": "application/json", "Authorization": config.SOR.claimtoken }
  };
  //first write the chatscript
  var filename ="chat" + moment().format ('MM-DD-YYYY-HHMMSS') + ".txt";
  var writeStream  = fs.createWriteStream(filename);
  var chatscript = JSON.parse(JSON.stringify(req.body.chat));
  for(var sentence of chatscript)
  {
      writeStream.write(sentence.direction + ":" +  sentence.text + '\r\n');
  }
  writeStream.end();

  writeStream.on( 'finish', function() {
        //everyfile needs uniqueid
        var fileid = filename + "$^$" +Math.random() * (1000000 - 1000000) + 1000000;
        //upload the chatfile thus obtained
        var request = require('request');
        const options = {
          url:config.SOR.uploadapiurl,
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Accept-Charset': 'utf-8',
              "Authorization": config.SOR.claimtoken,
              "X-File-Identifier": fileid
            },
          };
        var req = request.post(options, function (err, resp, body) {
          if (err) {
            console.log('Error!' + err);
          }
          else
          {
            console.log('URL: ' + body);
            var args = {
                data: attachmentmodel,
                headers: { "Content-Type": "application/json", "Authorization": config.SOR.claimtoken }
            };

            var req = client.post(config.SOR.attachmentapiurl, args, function(err, response) {
              if (err[0]) {
                console.log('error:', JSON.stringify(err,null,1).substring(0,120));
                res.status(500).send({'Error': err[0].message + ". Error with rmA. Please contact your administrator"});
              }
              else {
                console.log('Link the attachment with event');
                res.status(200).send({'Success': "Chat record attached."});
                //we dont wnt to send a response back tht the file could not be sent.
              }      // raw response
            });

          }
        });

        //Next link the uploaded file with event or claim
        var form = req.form();
        form.append('file', fs.createReadStream(filename));

        attachmentmodel.documentAttachmentlst=filename;
        attachmentmodel.documentIdentifierList=fileid;

        req.on('requestTimeout', function (req) {
            console.log('request has expired');
            req.abort();
        });

        req.on('responseTimeout', function (res) {
            console.log('response has expired');
        });

        //it's usefull to handle request errors to avoid, for example, socket hang up errors on request timeouts
        req.on('error', function (err) {
            console.log('request error', err);
            res.status(500).send({'Error': err[0].message + ". Error with rmA. Please contact your administrator"});
        });

} );

} // sendDoc



var processcreateFNOLinSORResponse = function(config,res,response){
    if (config.debug) {console.log(" BASE <<< "+JSON.stringify(response,null,2));} //
    if (response.Error !== undefined) {
        res.status(500).send(response);
    } else {
        res.status(200).send(response);
    }
}
