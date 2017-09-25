var BILLS_SHEET = 'raw_bill_data';

var BILL_COLUMNS = [
  'bill_id',
  'bill_type',
  'congress',
  'urls.govtrack',
  'chamber',
  'committee_ids',
  'official_title',
  'short_title',
  'popular_title',
  'introduced_on',
  'last_action_at',
  'last_version_on',
  'last_action.text',
  'history.house_passage_result',
  'history.senate_passage_result',
  'sponsor_id',
  'sponsor.party',
  'sponsor.title',
  'sponsor.first_name',
  'sponsor.last_name',
  'cosponsors_count',
];

var USEFUL_BILL_TYPES = [
  'hr',
  // 'hres',
  'hjres',
  // 'hconres',
  's',
  // 'sres',
  'sjres',
  // 'sconres',
];

var PER_PAGE = 50;

var BASE_BILLS_URL = 'https://congress.api.sunlightfoundation.com/bills';

var LAST_UPDATE_DATE_KEY = 'last_update_date';


function buildDateURL(dateString, fields, pageNum) {
  return Utilities.formatString(
    '%s?&per_page=%s&last_action_at=%s&fields=%s&page=%s',
    BASE_BILLS_URL,
    PER_PAGE,
    dateString,
    fields.join(','),
    pageNum);
}

function buildBillURL(billId, fields) {
  return Utilities.formatString(
    '%s?bill_id=%s&fields=%s',
    BASE_BILLS_URL,
    billId,
    fields
   );
}

function writeBill(rowNum, bill) {
  var billRow = getSheet(BILLS_SHEET).getRange(rowNum, 1, 1, BILL_COLUMNS.length);

  var values = [];
  for(var i = 0; i < BILL_COLUMNS.length; i++) {
    var column = BILL_COLUMNS[i].split('.');
    values.push(getNestedKey(column, bill));
  }
  billRow.setValues([values]);
}

function refreshSpecificBill(billId) {
  var sheet = getSheet(BILLS_SHEET);
  var bill = getBill(billId);
  if (!bill) {
    throw new Error('Unable to find bill: ' + billId);
  }
  var currentBills = getExistingBills(BILLS_SHEET);
  var rowNum = currentBills[bill.bill_id] || sheet.getLastRow()+1;
  writeBill(rowNum, bill);
  return 'Bill: ' + billId + ' successfully refreshed!';
}

function refreshLatestBills() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var lastUpdateDate = new Date(scriptProperties.getProperty(LAST_UPDATE_DATE_KEY));
  var now = new Date();
  var i = 0;
  while ( lastUpdateDate <= now ) {
    var numBills = refreshDateBills(Utilities.formatDate(lastUpdateDate,'GMT', 'yyyy-MM-dd'));
    Logger.log('Refreshed %s bills for date: %s', numBills, Utilities.formatDate(lastUpdateDate, 'PST', 'yyyy-MM-dd'));
    scriptProperties.setProperty(LAST_UPDATE_DATE_KEY, lastUpdateDate);
    lastUpdateDate = incrementDay(lastUpdateDate);
    i++;
  }
  var doneString = Utilities.formatString('Done refreshing bills for %s days.', i);
  SpreadsheetApp.getActiveSpreadsheet().toast(doneString, 'Refreshing Bills');
}

var REAL_BILLS_SHEET = 'Bills_new';
function refreshBillIdsOnMainSheet() {
  var userBills = getExistingBills(REAL_BILLS_SHEET);
  var rawBills = getExistingBills(BILLS_SHEET);
  var userBillSheet = getSheet(REAL_BILLS_SHEET);

  for(var rawBillId in rawBills) {
    Logger.log(userBills[rawBillId]);
    if(!userBills[rawBillId]) {
      userBillSheet.appendRow([rawBillId]);
    }
  }
}

function refreshDateBills(dateString) {
  Logger.log(dateString);
  SpreadsheetApp.getActiveSpreadsheet().toast(Utilities.formatString('Fetching bills for date: %s', dateString));
  var sheet = getSheet(BILLS_SHEET);
  var dateBills = getDateBills(dateString);
  SpreadsheetApp.getActiveSpreadsheet().toast(Utilities.formatString('%s bills found for date: %s', dateBills.length, dateString));
  var currentBills = getExistingBills();
  writeHeader();
  for(var i = 0; i < dateBills.length; i++) {
    var newBill = dateBills[i];
    var rowNum = currentBills[newBill.bill_id] || sheet.getLastRow()+1;
    writeBill(rowNum, newBill);
  }
  SpreadsheetApp.getActiveSpreadsheet().toast(Utilities.formatString('Done refreshing bills for date: %s', dateBills.length, dateString));
  return dateBills.length
}


// BILLS
function getBill(billId) {
  var response = UrlFetchApp.fetch(buildBillURL(billId,BILL_COLUMNS));
  var content = JSON.parse(response.getContentText());
  if(content.results.length != 1) {
    return undefined;
  }
  return content.results[0];
}

function getDateBills(dateString) {
  var pageNum = 1;
  var numPages = 1;
  var allBills = []
  while(pageNum <= numPages) {
    var response = UrlFetchApp.fetch(buildDateURL(dateString,BILL_COLUMNS,pageNum));
    var content = JSON.parse(response.getContentText());
    numPages = Math.ceil(content.count / PER_PAGE );
    allBills = append(allBills, content.results);
    pageNum++;
  }
  return allBills;
}

function writeHeader() {
  var headerRow = getSheet(BILLS_SHEET).getRange(1,1,1,BILL_COLUMNS.length);
  headerRow.setValues([BILL_COLUMNS]);
}

function getExistingBills(sheet) {
 var sheet = getSheet(sheet);
  var bills = sheet.getRange('A:A').getValues();

 var existingBills = {};
 for (var i = 0; i < bills.length; i++) {
   existingBills[bills[i]] = i+1;
 }
 return existingBills;
}
