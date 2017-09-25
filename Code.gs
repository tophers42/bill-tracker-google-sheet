
function onOpen() {
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .createMenu('Custom Menu')
  .addItem('Refresh Legislators', 'refreshLegislators')
  .addItem('Show Sidebar', 'showSidebar')
      .addToUi();

  refreshLatestBills();
}


var LEGISLATORS_SHEET = 'raw_legislators';
var COMMITTEES_SHEET = 'raw_committee';
var COMMITTEE_MEMBERSHIP_SHEET = 'raw_committee_membership';

// LEGISLATORS
function getLegislators() {
  var response = UrlFetchApp.fetch("https://congress.api.sunlightfoundation.com/legislators?per_page=all");
  var content = JSON.parse(response.getContentText());
  return content.results;
}

function refreshLegislators() {
  var sheet = getSheet(LEGISLATORS_SHEET);
  var legislators = getLegislators();
  sheet.clear();

  var columns= Object.keys(legislators[0]);
  createSheet(sheet, columns, legislators);
}

// COMMITTEES
function getCommittees() {
  var response = UrlFetchApp.fetch("https://congress.api.sunlightfoundation.com/committees?per_page=all");
  var content = JSON.parse(response.getContentText());
  return content.results;
}

function refreshCommittees() {
  var sheet = getSheet(COMMITTEES_SHEET);
  var committees = getCommittees();
  sheet.clear();

  var columns= Object.keys(committees[0]);
  createSheet(sheet, columns, committees);
}

// COMMITTEE MEMBERSHIP
function getCommitteeMembership() {
  var response = UrlFetchApp.fetch("https://congress.api.sunlightfoundation.com/committees?per_page=all&fields=member_ids");
  var content = JSON.parse(response.getContentText());
  // flatten the list into member_id-committee_id pairs
  var results = content.results;
  var membership = [];
  for(var i=0; i<results.length; i++) {
    var result = results[i];
    var committee_id = result.committee_id;
    var members = result.member_ids;
    for(var j=0; j<members.length; j++) {
      membership.push({member_id: members[j], committee_id: committee_id});
    }
  }
  return membership;
}

function refreshCommitteeMembership() {
  var sheet = getSheet(COMMITTEE_MEMBERSHIP_SHEET);
  var committee_membership = getCommitteeMembership();
  sheet.clear();

  var columns= Object.keys(committee_membership[0]);
  createSheet(sheet, columns, committee_membership);
}

function showSidebar() {
    var template = HtmlService.createTemplateFromFile('sidebar');
//  template.response = response;
  var html = template.evaluate()
      .setTitle('My custom sidebar')
      .setWidth(300);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showSidebar(html);
}
