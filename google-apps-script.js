/**
 * Google Apps Script Backend for React CRUD Application
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Apps Script project
 * 2. Copy and paste this entire code into Code.gs
 * 3. Create a new Google Sheet or use existing one
 * 4. Update the SHEET_ID variable below with your Google Sheet ID
 * 5. Set up the sheet with headers: ID, Name, Email, Phone, Department, Position
 * 6. Deploy as Web App with execute permissions for "Anyone"
 * 7. Copy the Web App URL to your React .env file
 */

// Configuration - REPLACE WITH YOUR GOOGLE SHEET ID
const SHEET_ID = 'GOOGLE_SHEET_ID'; // Replace this with your actual Sheet ID
const SHEET_NAME = 'GOOGLE_SHEET_NAME'; // Change this if your sheet has a different name

const COLUMNS = {}; // Add column name and index here ( NAME: INDEX )

/**
 * Handle GET requests
 */
function doGet(e) {
  if (e.parameter.action === 'getAll') {
    return ContentService.createTextOutput(JSON.stringify(getAllRecords()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  else if (e.parameter.action === 'get' && e.parameter.id) {
    return ContentService.createTextOutput(JSON.stringify(getRecord(e.parameter.id)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'create') {
    return ContentService.createTextOutput(JSON.stringify(createRecord(data.data)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  else if (data.action === 'createMultiple') {
    return ContentService.createTextOutput(JSON.stringify(createMultipleRecords(data.data)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  else if (data.action === 'modify') {
    return ContentService.createTextOutput(JSON.stringify(modifyMultipleRecords(data.data)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  else if (data.action === 'update') {
    return ContentService.createTextOutput(JSON.stringify(updateRecord(data.id, data.data)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  else if (data.action === 'delete') {
    return ContentService.createTextOutput(JSON.stringify(deleteRecord(data.id)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get the Google Sheet
 */
function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

/**
 * Generate a unique ID
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * Convert row to record object
 */
function rowToRecord(row, rowIndex) {
  if (!row || row.length < Object.keys(COLUMNS).length) return null;

  const record = {};
  Object.keys(COLUMNS).forEach(key => {
    record[key.toLowerCase()] = row[COLUMNS[key]] || '';
  });
  record.rowIndex = rowIndex;
  
  return record;
}

function recordToRowObject(record, id = undefined) {
  if (!record || !record.id) return null;

  const row = [];
  Object.keys(record).forEach(key => {
    if (key.toLowerCase() === 'id') {
      row['id'] = id !== undefined ? id : record.id || '';
    } else {
      row[key.toLowerCase()] = record[key];
    }
  });
  
  return row;
}

/**
 * Convert record to row array
 */
function recordToRow(record) {
  return [
    ...recordToRowObject(record)
  ];
}

/**
 * Capitalize first letter of a string
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Get all records
 */
function getAllRecords() {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row (index 0)
    const records = [];
    for (let i = 1; i < data.length; i++) {
      const record = rowToRecord(data[i], i + 1);
      if (record && record.id) {
        delete record.rowIndex;
        records.push(record);
      }
    }
    
    return { records: records };
  } catch (error) {
    return { error: 'Failed to fetch records: ' + error.toString() };
  }
}

/**
 * Get a record by ID
 */
function getRecord(id) {
  try {
    if (!id) {
      return { error: 'ID is required' };
    }
    
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const record = rowToRecord(data[i], i + 1);
      if (record && record.id === id) {
        delete record.rowIndex;
        return { record: record };
      }
    }
    
    return { error: 'Record not found' };
  } catch (error) {
    return { error: 'Failed to fetch record: ' + error.toString() };
  }
}

/**
 * Create a new record
 */
function createRecord(recordData) {
  try {
    if (!recordData || !recordData.name || !recordData.email) {
      return { error: 'Name and email are required' };
    }
    
    const sheet = getSheet();
    
    const newRecord = recordToRowObject(recordData, generateId());
    
    const row = recordToRow(newRecord);
    sheet.appendRow(row);
    
    return { record: newRecord };
  } catch (error) {
    return { error: 'Failed to create record: ' + error.toString() };
  }
}

/**
 * Create a new multiple records
 */
function createMultipleRecords(recordsData) {
  try {
    if (!Array.isArray(recordsData)) {
      return { error: 'No records provided for batch creation' };
    }

    const sheet = getSheet();

    const lastRow = sheet.getLastRow();
    const startRow = lastRow + 1;
    
    const batchData = [];
    const createdRecords = [];
    
    recordsData.forEach((recordData) => {
      const id = generateId();
      const rowData = recordToRow(recordData);
      
      batchData.push(rowData);
      
      createdRecords.push(recordToRowObject(recordData, id));
    });
    
    if (batchData.length > 0) {
      const range = sheet.getRange(startRow, 1, batchData.length, batchData[0].length);
      range.setValues(batchData);
    }

    return { records: createdRecords };
  } catch (error) {
    return { error: 'Failed to create multiple records: ' + error.toString() };
  }
}

/**
 * Update an existing record
 */
function updateRecord(id, recordData) {
  try {
    if (!id) {
      return { error: 'ID is required' };
    }
    
    if (!recordData || !recordData.name || !recordData.email) {
      return { error: 'Name and email are required' };
    }
    
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const record = rowToRecord(data[i], i + 1);
      if (record && record.id === id) {
        const updatedRecord = recordToRowObject(recordData, id);
        
        const row = recordToRow(updatedRecord);
        sheet.getRange(i + 1, 1, 1, Object.keys(COLUMNS).length).setValues([row]);
        
        return { record: updatedRecord };
      }
    }
    
    return { error: 'Record not found' };
  } catch (error) {
    return { error: 'Failed to update record: ' + error.toString() };
  }
}

/**
 * Update/Create a multiple records
 */
function modifyMultipleRecords(recordsData) {
  try {
    if (!Array.isArray(recordsData)) {
      return { error: 'No records provided for batch modify' };
    }

    const sheet = getSheet();

    const data = sheet.getDataRange().getValues();
    const modifyRecords = [];
    
    for (let i = 0; i < recordsData.length; i++) {
      const recordData = recordsData[i]
      const rowDataIndex = data.findIndex((row, index) => index > 0 && Number(row[0]) === Number(recordData.id))
      if (rowDataIndex > -1) {
        const updatedRecord = recordToRowObject(recordData);

        modifyRecords.push(updatedRecord);
        
        const row = recordToRow(updatedRecord);
        sheet.getRange(rowDataIndex + 1, 1, 1, Object.keys(COLUMNS).length).setValues([row]);
      } else {
        const newRecord = recordToRowObject(recordData);

        modifyRecords.push(newRecord);
        
        const row = recordToRow(newRecord);
        sheet.appendRow(row);
      }
    }

    return { records: modifyRecords };
  } catch (error) {
    return { error: 'Failed to create multiple records: ' + error.toString() };
  }
}

/**
 * Delete a record
 */
function deleteRecord(id) {
  try {
    if (!id) {
      return { error: 'ID is required' };
    }
    
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const record = rowToRecord(data[i], i + 1);
      if (record && record.id === id) {
        sheet.deleteRow(i + 1);
        delete record.rowIndex;
        return { record: record };
      }
    }
    
    return { error: 'Record not found' };
  } catch (error) {
    return { error: 'Failed to delete record: ' + error.toString() };
  }
}

/**
 * Initialize sheet with headers
 */
function initializeSheet() {
  try {
    const sheet = getSheet();
    
    const firstRow = sheet.getRange(1, 1, 1, Object.keys(COLUMNS).length).getValues()[0];
    if (firstRow[0].toLowerCase() !== Object.keys(COLUMNS)[0].toLowerCase() || firstRow[1].toLowerCase() !== Object.keys(COLUMNS)[1].toLowerCase()) {
      const headers = Object.keys(COLUMNS).map(key => capitalize(key));
      sheet.getRange(1, 1, 1, Object.keys(COLUMNS).length).setValues([headers]);
      
      const headerRange = sheet.getRange(1, 1, 1, Object.keys(COLUMNS).length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
    }
  } catch (error) {
    console.error('Error initializing sheet:', error);
  }
}
