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

    // var intent = req.body.queryResult && 
    // req.body.intent
    // ? req.body.intent 
    // :  "No intent." 

    var repo = req.body.queryResult &&
      req.body.queryResult.parameters &&
      req.body.queryResult.parameters.repo ? req.body.queryResult.parameters.repo : null
    
    var owner = req.body.queryResult &&
      req.body.queryResult.parameters &&
      req.body.queryResult.parameters.owner ? req.body.queryResult.parameters.owner : null

    // var repo = req.body.repo ? req.body.repo : null
    // var owner = req.body.owner ? req.body.owner : null

    var testing = "nothing."

    var speech = "A problem occured. Intent: " + intent + ". " + "Repo: " + repo + ". " + "Owner: " + owner + "."

    repo = repo ? repo.replace(/\s/g, '') : null
    owner = owner ? owner.replace(/\s/g, '') : null

    if (intent === 'number of repos for user')
    {
      var username = req.body.queryResult.parameters.userName
        ? req.body.queryResult.parameters.userName : null;

      speech = "Something went wrong. Possibly the username parameter."
      
      if (username)
      {
        var myerror = false;

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
    }

  if (intent === 'number of open issues' && repo && owner)
  {
    speech = "Something went wrong.";
    
    testing = testing + " passed inputs."
    
    var myerror = false;

    const getIssues = async () => 
    {
      try 
      {
        testing = testing + " in getIssues(). " + owner + repo
        return await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`);
      } catch (error) 
      {
        myerror = true;
        speech = 'Cannot get number of open issues for ' + owner + "/" + repo + '.';
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

  if (intent === 'number of assigned open issues'  && repo && owner )
  {
    var assignee = req.body.queryResult.parameters.assignee
      ? req.body.queryResult.parameters.assignee : null
    
    testing = testing + " passed inputs."

    // var assignee = req.body.assignee ? req.body.assignee : null;

    speech = "Something went wrong. Possibly the assignee parameter."

    if (assignee)
    {
      var myerror = false;
      const getIssues = async () => 
      {
        try 
        {
          testing = testing + " in getIssues(). " + owner + repo
          return await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues?assignee=${assignee}`);
        } catch (error) 
        {
          myerror = true;
          speech = 'Cannot get number of open issues assigned to ' + assignee + ' in ' + owner + "/" + repo + '.';
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

        speech = assignee + " has " + count + " open issues assigned in " + owner + "/" + repo + "."
      }
    }
  }

  if (intent === 'available labels'  && repo && owner )
  {
    speech = "Something went wrong."
    
    testing = testing + " passed inputs."

    const getIssues = async () => 
    {
      var myerror = false;
      try 
      {
        testing = testing + " in getIssues(). " + owner + repo
        return await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`);
      } catch (error) 
      {
        myerror = true;
        speech = 'Cannot get the available labels in ' + owner + "/" + repo + '.';
        console.error("ERROR OCCURED: " + error);
      }
    }

    const issues = await getIssues()

    if (!myerror)
    {
      var labels = new Set();
      var json = issues.data;
      console.log(json.length)
      testing = testing + " counting!!!!"
      for(var i = 0; i < json.length; i++) {
        for (var j = 0; j < json[i].labels.length; j++)
        {
          var lbl = json[i].labels[j].name;
          labels.add(lbl);
        }
      }
      speech = "The available labels are "
      for(var labl of labels.values())
      {
          speech += labl + ", "
      }
      speech = speech.slice(0, speech.length - 2) + "."
    }
  }

  if (intent === 'issues with label' && repo && owner )
  {
    var label = req.body.queryResult.parameters.label
    ? req.body.queryResult.parameters.label : null
    
    testing = testing + " passed inputs."

    // var label = req.body.label ? req.body.label : null;

    speech = "Something went wrong. Possibly the label parameter."

    if (label)
    {
      var myerror = false;
      const getIssues = async () => 
      {
        try 
        {
          testing = testing + " in getIssues(). " + owner + repo
          return await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues?labels=${encodeURIComponent(label)}`);
        } catch (error) 
        {
          myerror = true;
          speech = 'Cannot get the open issues with label ' + label + ' in ' + owner + "/" + repo + '.';
          console.error("ERROR OCCURED: " + error);
        }
      }

      const issues = await getIssues()

      if (!myerror)
      {
        var json = issues.data;
        var titles = [];
        testing = testing + " counting!!!!"
        for(var i = 0; i < json.length; i++) {
            titles.push(json[i].title);
        }
        console.log(titles)
        if (json.length > 0)
        {
          speech = "There are " + json.length + " issues with label " + label + "." + " The titles include "
          for(var t of titles.values())
          {
              speech += t + ", "
          }
          speech = speech.slice(0, speech.length - 2) + "."
        }
        else
        {
          speech = "There are no issues with the label " + label + " in " + owner + "/" + repo + "."
        }
      }
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
