//Example POST method invocation
module.exports = {

        createFNOLinSOR : function(config,claimmodel,req,res) {
        sendClaim(config,claimmodel,req,res,processcreateFNOLinSORResponse);
 } //createFNOLinSOR
} // exports

// ------------------------------------------------------------
// Private
// ------------------------------------------------------------
var sendClaim = function(config,claimmodel,req,res,next){

  if (config.debug) {
      console.log("--- Connect to System Of Record: " + config.SOR.systemname);
      console.log("---Reading the request " + req.body.context.PolicyNumber + " " + req.body.context.ReportingPerson);
  }

  var Client = require('node-rest-client').Client;
  var client = new Client();
  claimmodel.addr1 = req.body.context.Address;
  claimmodel.eventDescription = "PolicyNumber is " + req.body.context.PolicyNumber + "Reported By " +req.body.context.ReportingPerson  ;

  // set content-type header and data as json in args parameter
  var args = {
      data: claimmodel,
      headers: { "Content-Type": "application/json", "Authorization": config.SOR.claimtoken }
  };
  //config.SOR.claimapiurl
  var req = client.post("test.html", args, function(err, response) {
        /*
        if (config.debug) {
            console.log(response);
            console.log(data);
        }
        */
        if (err[0]) {
          console.log('error:', JSON.stringify(err,null,1).substring(0,120));
          next(config,res,{'Error': err[0].message + ". Error with rmA. Please contact your administrator"});
        }
        else {
          next(config,res,{'eventNumber':err.eventNumber});
        }

      // raw response
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

var processcreateFNOLinSORResponse = function(config,res,response){
    if (config.debug) {console.log(" BASE <<< "+JSON.stringify(response,null,2));} //
    if (response.Error !== undefined) {
        res.status(500).send(response);
    } else {
        res.status(200).send(response);
    }
}
