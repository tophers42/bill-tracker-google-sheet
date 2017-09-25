var MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

function toastify(message) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message);
}

function append(arr1, arr2) {
  for(var i = 0; i < arr2.length; i ++) {
    arr1.push(arr2[i]);
  }
  return arr1;
}

function compareArrs(arr1, arr2) {
  return arr1.length==arr2.length && arr1.every(function(v,i) { return v === arr2[i]});
}

function trimArr(arr) {
  var newArr = [];
  for( var i = 0; i < arr.length; i++) {
    if(arr[i]) {
      newArr[i] = arr[i];
    } else {
      break;
    }
  }
  return newArr;
}

function incrementDay(date) {
  return new Date(date.getTime() + MILLIS_PER_DAY);
}


function getSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  return sheet;
}

function insertData(sheet, data){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (data.length>0){
    ss.toast("Inserting "+data.length+" rows");
    sheet.insertRowsAfter(1, data.length);
    setRowsData(sheet, data);
  } else {
    ss.toast("All done");
  }
}

function test() {
  var x = { 'a': {'b':1}};
  var y = ['a','b'];
  Logger.log(getNestedKey(y, x));
}

function getNestedKey(keys, obj) {
  var value = obj[keys[0]];
  if( !value || keys.length === 1 ) {
    return value;
  }
  return getNestedKey(keys.slice(1), value);
}


function createSheet(sheet, columns, rowsData) {
  if (rowsData.length === 0 ) {
    Logger.log('No rows given');
    return;
  }

  var data = []
  data.push(columns);
  for(var i = 0; i < rowsData.length; i++) {
    var row = rowsData[i];
    var values = []
    for(var j = 0; j < columns.length; j++) {
      var columnName = columns[j];
      values.push(row[columnName]);
    }
    data.push(values);
  }

  var range = sheet.getRange(1,1,data.length,columns.length);
  range.setValues(data);
}



function createRow(range, columns, rowData) {
  var values = [];
  Logger.log('Creating row: ' + range.getA1Notation());
  for(var i = 0; i < columns.length; i++) {
    var columnName = columns[i];
    Logger.log('column_name: ' + columnName + ' value: ' + rowData[columnName]);

  }
  range.setValues(values);
}


// Back to the stuff from Google -->

// setRowsData fills in one row of data per object defined in the objects Array.
// For every Column, it checks if data objects define a value for it.
// Arguments:
//   - sheet: the Sheet Object where the data will be written
//   - objects: an Array of Objects, each of which contains data for a row
//   - optHeadersRange: a Range of cells where the column headers are defined. This
//     defaults to the entire first row in sheet.
//   - optFirstDataRowIndex: index of the first row where data should be written. This
//     defaults to the row immediately below the headers.
function setRowsData(sheet, objects, optHeadersRange, optFirstDataRowIndex) {
  var headersRange = optHeadersRange || sheet.getRange(1, 1, 1, sheet.getMaxColumns());
  var firstDataRowIndex = optFirstDataRowIndex || headersRange.getRowIndex() + 1;
  var headers = normalizeHeaders(headersRange.getValues()[0]);

  var data = [];
  for (var i = 0; i < objects.length; ++i) {
    var values = []
    for (j = 0; j < headers.length; ++j) {
      var header = headers[j];
      values.push(header.length > 0 && objects[i][header] ? objects[i][header] : "");
    }
    data.push(values);
  }
  var destinationRange = sheet.getRange(firstDataRowIndex, headersRange.getColumnIndex(),
                                        objects.length, headers.length);
  destinationRange.setValues(data);
}

// getRowsData iterates row by row in the input range and returns an array of objects.
// Each object contains all the data for a given row, indexed by its normalized column name.
// Arguments:
//   - sheet: the sheet object that contains the data to be processed
//   - range: the exact range of cells where the data is stored
//   - columnHeadersRowIndex: specifies the row number where the column names are stored.
//       This argument is optional and it defaults to the row immediately above range;
// Returns an Array of objects.
function getRowsData(sheet, range, columnHeadersRowIndex) {
  columnHeadersRowIndex = columnHeadersRowIndex || range.getRowIndex() - 1;
  var numColumns = range.getEndColumn() - range.getColumn() + 1;
  var headersRange = sheet.getRange(columnHeadersRowIndex, range.getColumn(), 1, numColumns);
  var headers = headersRange.getValues()[0];
  return getObjects(range.getValues(), normalizeHeaders(headers));
}

// For every row of data in data, generates an object that contains the data. Names of
// object fields are defined in keys.
// Arguments:
//   - data: JavaScript 2d array
//   - keys: Array of Strings that define the property names for the objects to create
function getObjects(data, keys) {
  var objects = [];
  for (var i = 0; i < data.length; ++i) {
    var object = {};
    var hasData = false;
    for (var j = 0; j < data[i].length; ++j) {
      var cellData = data[i][j];
      if (isCellEmpty(cellData)) {
        continue;
      }
      object[keys[j]] = cellData;
      hasData = true;
    }
    if (hasData) {
      objects.push(object);
    }
  }
  return objects;
}

// Returns an Array of normalized Strings.
// Arguments:
//   - headers: Array of Strings to normalize
function normalizeHeaders(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    var key = normalizeHeader(headers[i]);
    if (key.length > 0) {
      keys.push(key);
    }
  }
  return keys;
}

// Normalizes a string, by removing all alphanumeric characters and using mixed case
// to separate words. The output will always start with a lower case letter.
// This function is designed to produce JavaScript object property names.
// Arguments:
//   - header: string to normalize
// Examples:
//   "First Name" -> "firstName"
//   "Market Cap (millions) -> "marketCapMillions
//   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
function normalizeHeader(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    //if (!isAlnum(letter)) {
    //  continue;
    //}
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//   - cellData: string
function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}
// http://jsfromhell.com/array/chunk
function chunk(a, s){
    for(var x, i = 0, c = -1, l = a.length, n = []; i < l; i++)
        (x = i % s) ? n[c][x] = a[i] : n[++c] = [a[i]];
    return n;
}
