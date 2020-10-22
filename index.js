'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const restService = express();

const token = process.env.GITHUB_API_KEY;

restService.use(
    bodyParser.urlencoded({
      extended: true,
    }),
);

restService.use(bodyParser.json());

restService.post('/', async function(req, res) {
  // const intent =
  //   req.body.queryResult &&
  //   req.body.queryResult.intent &&
  //   req.body.queryResult.intent.displayName ?
  //   req.body.queryResult.intent.displayName :
  //   'No intent.';

  /* comments like this are from my local tests, can delete */

  var intent = req.body.queryResult &&
    req.body.intent
    ? req.body.intent
    : 'No intent.'

  // let repo =
  //   req.body.queryResult &&
  //   req.body.queryResult.parameters &&
  //   req.body.queryResult.parameters.repo ?
  //   req.body.queryResult.parameters.repo :
  //   null;

  // let owner =
  //   req.body.queryResult &&
  //   req.body.queryResult.parameters &&
  //   req.body.queryResult.parameters.owner ?
  //   req.body.queryResult.parameters.owner :
  //   null;

  var repo = req.body.repo ? req.body.repo : null
  var owner = req.body.owner ? req.body.owner : null

  let speech =
    'A problem occured. Intent: ' +
    intent +
    '. ' +
    'Repo: ' +
    repo +
    '. ' +
    'Owner: ' +
    owner +
    '.';

  // if people were to spell out the repo name or the owner name, there would be spaces separateing the characters
  // getting rid of the spaces here
  repo = repo ? repo.replace(/\s/g, '') : null;
  owner = owner ? owner.replace(/\s/g, '') : null;

  if (intent === 'number of repos for user') {
    // var username = req.body.queryResult.parameters.userName
    //   ? req.body.queryResult.parameters.userName : null;

    const username = req.body.userName ? req.body.userName : null;

    speech = 'Something went wrong. Possibly the username parameter.';

    if (username) {
      let myerror = false;

      async function getRepos() {
        try {
          return await axios.get(
            `https://api.github.com/users/${username}/repos`,
            {headers: {Authorization: `Token ${token}`}}
          );
        } catch (error) {
          myerror = true;
          speech = 'Cannot get number of repos for ' + username + '.';
          console.error('ERROR OCCURED: ' + error);
        }
      }

      const repos = await getRepos(username);

      if (!myerror) {
        speech =
          'User ' +
          username +
          ' has ' +
          Object.keys(repos.data).length +
          ' number of repositories.';
      }
    }
  }

  if (intent === 'number of open issues' && repo && owner) {
    speech = 'Something went wrong.';

    let myerror = false;

    async function getIssues(){
      try {
        return await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          { headers: { Authorization: `Token ${token}` } }
        );
      } catch (error) {
        myerror = true;
        speech =
          'Cannot get number of open issues for ' + owner + '/' + repo + '.';
        console.error('ERROR OCCURED: ' + error);
      }
    };

    const issues = await getIssues();

    if (!myerror) {
      let count = 0;
      let json = issues.data;

      speech = owner + '/' + repo + ' has ' + json.length + ' open issues.';
    }
  }

  if (intent === 'available labels' && repo && owner) {
    speech = 'Something went wrong.';
    let myerror = false;

    async function getIssues() {
      try {
        return await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
          { headers: { Authorization: `Token ${token}` } }
        );
      } catch (error) {
        myerror = true;
        speech =
          'Cannot get the available labels in ' + owner + '/' + repo + '.';
        console.error('ERROR OCCURED: ' + error);
      }
    };

    const issues = await getIssues();

    if (!myerror) {
      let labels = new Set();
      let json = issues.data;
      console.log(json.length);
      for (let i = 0; i < json.length; i++) {
        for (let j = 0; j < json[i].labels.length; j++) {
          let lbl = json[i].labels[j].name;
          labels.add(lbl);
        }
      }
      speech = 'The available labels are ';
      for (let labl of labels.values()) {
        speech += labl + ', ';
      }
      speech = speech.slice(0, speech.length - 2) + '.';
    }
  }

  if (intent === 'issues with label' && repo && owner) {
    var label = req.body.queryResult.parameters.label
      ? req.body.queryResult.parameters.label
      : null;

    // var label = req.body.label ? req.body.label : null;

    speech = 'Something went wrong. Possibly the label parameter.';

    if (label) {
      let myerror = false;
      async function getIssues() {
        try {
          return await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/issues?labels=${encodeURIComponent(label)}`,
            { headers: { Authorization: `Token ${token}` } }
          );
        } catch (error) {
          myerror = true;
          speech =
            'Cannot get the open issues with label ' +
            label +
            ' in ' +
            owner +
            '/' +
            repo +
            '.';
          console.error('ERROR OCCURED: ' + error);
        }
      };

      const issues = await getIssues();

      if (!myerror) {
        var json = issues.data;
        var titles = [];
        for (var i = 0; i < json.length; i++) {
          titles.push(json[i].title);
        }
        if (json.length > 0) {
          speech =
            'There are ' +
            json.length +
            ' issues with label ' +
            label +
            '.' +
            ' The titles include ';
          for (var t of titles.values()) {
            speech += t + ', ';
          }
          speech = speech.slice(0, speech.length - 2) + '.';
        } else {
          speech =
            'There are no issues with the label ' +
            label +
            ' in ' +
            owner +
            '/' +
            repo +
            '.';
        }
      }
    }
  }

  if (intent === 'issues assigned to x' && repo && owner) {
    var assignee = req.body.queryResult.parameters.assignee
      ? req.body.queryResult.parameters.assignee
      : null;

    // var assignee = req.body.assignee ? req.body.assignee : null;

    speech = 'Something went wrong. Possibly the label parameter.';

    if (assignee) {
      let myerror = false;
      async function getIssues() {
        try {
          return await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/issues?assignee=${assignee}`,
            { headers: { Authorization: `Token ${token}` } }
          );
        } catch (error) {
          myerror = true;
          speech =
            'Cannot get number of open issues assigned to ' +
            assignee +
            ' in ' +
            owner +
            '/' +
            repo +
            '.';
          console.error('ERROR OCCURED: ' + error);
        }
      };

      const issues = await getIssues();

      if (!myerror) {
        var json = issues.data;
        var titles = [];
        for (var i = 0; i < json.length; i++) {
          titles.push(json[i].title);
        }

        if (json.length > 0) {
          speech =
            'There are ' +
            json.length +
            ' open issues with assigned to ' +
            assignee +
            '.' +
            ' The titles include ';
          for (var t of titles.values()) {
            speech += t + ', ';
          }
          speech = speech.slice(0, speech.length - 2) + '.';
        } else {
          speech =
            'There are no issues with the assignee ' +
            assignee +
            ' assigned in ' +
            owner +
            '/' +
            repo +
            '.';
        }
      }
    }
  }

  if (intent === 'issue number assignees' && repo && owner) {
    var issue_num = req.body.queryResult.parameters.number
      ? req.body.queryResult.parameters.number
      : null;

    // var issue_num = req.body.number ? req.body.number : null;

    speech = 'Something went wrong. Possibly the label parameter.';

    if (issue_num) {
      let myerror = false;
      async function getIssues(){
        try {
          return await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issue_num}`,
            {headers: {Authorization: `Token ${token}`}}
          );
        } catch (error) {
          myerror = true;
          speech =
            'Cannot get the assignees of the issue number ' +
            issue_num +
            ' in ' +
            owner +
            '/' +
            repo +
            '.';
          console.error('ERROR OCCURED: ' + error);
        }
      };

      const issues = await getIssues();

      if (!myerror) {
        var json = issues.data;

        if (json.assignees.length > 1) {
          speech =
            'There are ' +
            json.assignees.length +
            ' people assigned to issue #' +
            issue_num +
            '.' +
            ' They are ';
          for (var i = 0; i < json.assignees.length; i++) {
            speech += json.assignees[i].login + ', ';
          }
          speech = speech.slice(0, speech.length - 2) + '.';
        } else {
          if (json.assignees.length === 1) {
            speech =
              'Issue #' +
              issue_num +
              ' was assigned to ' +
              json.assignees[0].login +
              '.';
          } else {
            speech =
              'Issue #' +
              issue_num +
              ' has no assignee in ' +
              owner +
              '/' +
              repo +
              '.';
          }
        }
      }
    }
  }

  if (intent === 'issues added recently' && repo && owner) {
    var startDate =
      req.body.queryResult.parameters.date_period &&
      req.body.queryResult.parameters.date_period.startDate
        ? req.body.queryResult.parameters.date_period.startDate
        : null;
    var endDate =
      req.body.queryResult.parameters.date_period &&
      req.body.queryResult.parameters.date_period.endDate
        ? req.body.queryResult.parameters.date_period.endDate
        : null;

    // var startDate = req.body.startDate ? req.body.startDate : null;
    // var endDate = req.body.endDate ? req.body.endDate : null;

    speech = 'Something went wrong. Possibly the label parameter.';

    if (startDate && endDate) {
      let myerror = false;
      async function getIssues() {
        try {
          return await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {headers: {Authorization: `Token ${token}`}}
          );
        } catch (error) {
          myerror = true;
          speech = 'Cannot get issues for ' + owner + '/' + repo + '.';
          console.error('ERROR OCCURED: ' + error);
        }
      };
      const issues = await getIssues();

      if (!myerror) {
        var start = new Date(startDate);
        var end = new Date(endDate);

        var json = issues.data;

        var titles = [];
        for (var i = 0; i < json.length; i++) {
          var data = new Date(json[i].created_at);
          if (data - start >= 0 && end - data >= 0) {
            titles.push(json[i].title);
          }
        }

        if (json.length > 0) {
          speech =
            'There are ' +
            titles.length +
            ' open issues that is within the span of time.' +
            ' The titles include ';
          for (var t of titles.values()) {
            speech += t + ', ';
          }
          speech = speech.slice(0, speech.length - 2) + '.';
        } else {
          speech =
            'There are no issues within the span of time in ' +
            owner +
            '/' +
            repo +
            '.';
        }
      }
    } else {
      speech = 'Something went wrong. Possibly the date_period parameter.';
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
    displayText: speech,
    source: 'webhook-echo-sample'
  });
});

restService.listen(process.env.PORT || 8000, function() {
  console.log('Server up and listening!');
});
