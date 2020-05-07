"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios")

const restService = express();

restService.use(
  bodyParser.urlencoded({
    extended: true
  })
);

restService.use(bodyParser.json());

restService.post( "/", async function (req, res) {
    var intent = req.body.queryResult && 
    req.body.queryResult.intent && 
    req.body.queryResult.intent.displayName 
    ? req.body.queryResult.intent.displayName 
    :  "No intent."

    /*var intent = req.body.queryResult && 
    req.body.intent
    ? req.body.intent 
    :  "No intent." */


    var testing = "nothing."

    var speech = "A problem occured. Intent: " + intent

    if (intent === 'number of repos for user')
    {
      speech = req.body.queryResult &&
      req.body.queryResult.parameters &&
      req.body.queryResult.parameters.userName
      ? req.body.queryResult.parameters.userName
      : "Seems like some problem. Speak again.";

      var myerror = false;
      var username = req.body.queryResult.parameters.userName

      const getRepos = async () => {
        try {
          return await axios.get(`https://api.github.com/users/${username}/repos`);
        } catch (error) {
          myerror = true;
          speech = 'Cannot get number of repos for ' + username + '.';
          console.error("ERROR OCCURED: " + error);
        }
      }

      const repos = await getRepos()

      if (!myerror)
      {
        speech = 'User ' + username + ' has ' + Object.keys(repos.data).length + ' number of repositories.';
      }
    }

  if (intent === 'open issues in repo')
  {
    var speech = req.body.queryResult &&
    req.body.queryResult.parameters &&
    req.body.queryResult.parameters.owner && 
    req.body.queryResult.parameters.repo
    ? req.body.queryResult.parameters.owner
    : "Seems like some problem. Speak again.";
    
    testing = testing + " passed inputs."
    /*var speech = req.body.queryResult &&
    req.body.queryResult.parameters &&
    req.body.owner &&
    req.body.repo
    ? req.body.owner
    : "Seems like some problem. Speak again.";*/
    
    var myerror = false;
    var owner = req.body.queryResult.parameters.owner;
    var repo = req.body.queryResult.parameters.repo;
    // var owner = req.body.owner
    // var repo = req.body.repo

    const getIssues = async () => 
    {
      try 
      {
        testing = testing + " in getIssues(). " + owner + repo
        return await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`);
      } catch (error) 
      {
        myerror = true;
        speech = 'Cannot get number of open issues for the repo ' + repo + ' under owner ' + owner + '.';
        console.error("ERROR OCCURED: " + error);
      }
    }

    const issues = await getIssues()

    if (!myerror)
    {
      var count = 0;
      var json = issues.data;
      testing = testing + " counting!!!!"
      for(var i = 0; i < json.length; i++) {
        var obj = json[i];
        if (obj.state === 'open')
        {
          count = count + 1;
        }
      }

      speech = owner + "/" + repo + " has " + count + " open issues."
    }
  }


  var speechResponse = {
    google: {
      expectUserResponse: true,
      richResponse: {
        items: [
          {
            simpleResponse: {
              textToSpeech: speech
            }
          }
        ]
      }
    }
  };

  return res.json({
    payload: speechResponse,
    //data: speechResponse,
    fulfillmentText: speech,
    speech: speech,
    displayText: testing,
    source: "webhook-echo-sample"
  });
});


restService.listen(process.env.PORT || 8000, function () {
  console.log("Server up and listening!");
});
