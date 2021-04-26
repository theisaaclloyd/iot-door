
const redirect_uri = "https://script.google.com/macros/s/AKfycbz4SnjTZZGvbn4aVzCa69pWsXjXm1oWpyvgyOHEMz_EChRf9oH_b5NPzLbob0VsvOfk/exec";
//use this script I wrote as a redirect uri or write your own. 
//the code for this script can be found here: 

const tokenService = 'https://accounts.spotify.com/api/token'

// get these credentials from your app: https://developer.spotify.com/dashboard/applications
const client_id = "SPOTIFY CLIENT ID";
const client_secret = "SPOTIFY CLIENT SECRET";

// the name and id of the sheet you would like to log the data in.
const spreadsheetID = '1HJl2i2se2LWsYz-AoMX1oeI08CYuoYLFOMMkp1uufao';
const sheetName = 'Records';

var properties = PropertiesService.getScriptProperties();


async function getToken() {
  var json;

  if (properties.getProperty('access_token') && properties.getProperty('refresh_token')) { // refresh old token

    Logger.log("Refreshing old token!");

    const response = UrlFetchApp.fetch(tokenService, {
      'method': 'post',
      'payload': {
        "grant_type": "refresh_token",
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": properties.getProperty('refresh_token')
      },
      //'headers': { 'Content-Type': 'application/json' },
      "muteHttpExceptions": true
    });

    json = JSON.parse(response.getContentText());
    //Logger.log(json)

  
  } 
  
  else { // get a new token
    Logger.log("Getting new token!");

    const response = UrlFetchApp.fetch(tokenService, {
      'method': 'post',
      'payload': {
        "grant_type": "authorization_code",
        "code": authCode,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri
      },

      //'headers': { 'Content-Type': 'application/json' },
      "muteHttpExceptions": true
    });
    json = JSON.parse(response.getContentText());
    //Logger.log(json)
  }

  if (json["error"]) { // something went wrong
    var error = json["error"];
    Logger.log(error);
  }

  else if (json["access_token"]) { // success
    properties.setProperty('access_token', json["access_token"]);

    if (json["refresh_token"]) properties.setProperty('refresh_token', json["refresh_token"]);

    Logger.log('Sucess!');
    Logger.log(`Token: ${json["access_token"]}`);
  }
}




function doGet(e) {
  doPost(e);
}
function doPost(e) {
  Logger.log(JSON.stringify(e));

  var result = JSON.stringify(e);
  var now = new Date();

  var event = e.parameter['event'];
  if (event) {
    event = String(event).trim();

    result = `Got event type: ${event}`;
    Logger.log(result);

    if (event == 'OPENED') {
      pauseSpotify();
    }
    

    var sheet = SpreadsheetApp.openById(spreadsheetID).getSheetByName(sheetName);
    var newRow = sheet.getLastRow() + 1;

    var rowData = [];

    //rowData[0] = "";
    rowData[1] = now;
    rowData[2] = event;

    Logger.log(JSON.stringify(rowData));
    var newRange = sheet.getRange(newRow, 1, 1, rowData.length);
    newRange.setValues([rowData]);
  }
  else {
    result = 'event type not specified:\n';
    result += JSON.stringify(data);
    Logger.log(result);
  }

  return ContentService.createTextOutput(result);
}

function spotifyTest() {
  var TOKEN = properties.getProperty('access_token');

  var params = {
    'method': 'get',
    'contentType': 'application/json',
    'muteHttpExceptions': true,
    'headers': { 'Authorization': 'Bearer ' + TOKEN }
  };

  var response = UrlFetchApp.fetch('https://api.spotify.com/v1/me', params);
  var data = JSON.parse(response.getContentText());

  if (data['display_name']) {
    Logger.log('Sucess!');
  }
  else {
    Logger.log('Error!');
  }

  //Logger.log(data);
}

async function pauseSpotify() {
  var tries = 0;
  var sucess = false;

  while (tries < 15 && !sucess) {
    var TOKEN = properties.getProperty('access_token');

    var params = {
      'method': 'put',
      'contentType': 'application/json',
      'muteHttpExceptions': true,
      'headers': { 'Authorization': 'Bearer ' + TOKEN }
    };

    var response = UrlFetchApp.fetch('https://api.spotify.com/v1/me/player/pause', params);
    var data = response.getContentText();
    if (data) {
      data = JSON.parse(data);
    }

    if (data['error']) {
      var error = data['error']['message'];

      if (error == 'Invalid access token') {
        Logger.log(`Error: ${error}.`);
        getToken();
      }

      else {
        Logger.log(`Error: ${error}. Trying again...`);
        Utilities.sleep(1000);
      }
      tries++;
      sucess = false;
    }
    else {
      sucess = true;
      Logger.log('Sucess!');
      break;
    }
  }
  //Logger.log(data);
}
