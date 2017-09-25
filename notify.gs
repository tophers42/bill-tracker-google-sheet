var sheetToWatch = "START HERE"; // sheet to watch
var valueToWatchFor = "test";
var slackWebhookURL = "https://hooks.slack.com/services/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"

function myOnEdit(event) {
  if(event.value && event.value == valueToWatchFor && event.oldValue != valueToWatchFor) {
    sendNotification(event.range, event.user);
  }
}

function sendNotification(range, user) {
  // Make a POST request with a JSON payload.
  var data = {
    'text': 'hello',
  };
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    // Convert the JavaScript object to a JSON string.
    'payload' : JSON.stringify(data)
  };
  UrlFetchApp.fetch(slackWebhookURL, options);
}
