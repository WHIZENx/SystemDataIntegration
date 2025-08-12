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

const COLUMNS = { id: 0 }; // Add column name and index here ( name: column index )
/** Example: COLUMNS = { 
   id: 0, 
   name: 1, 
   email: 2, 
   phone: 3, 
   department: 4, 
   position: 5, 
   profile_image: 6, 
   status: 7, 
   created_at: 8, 
   updated_at: 9 
} */

const findIdCol = Object.keys(COLUMNS).find(key => key.toLowerCase() === 'id');

/**
 * Handle GET requests
 */
function doGet(e) {
  if (e.parameter.action === 'getAll') {
    return ContentService.createTextOutput(JSON.stringify(getAllRecords()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  else if (e.parameter.action === 'get' && e.parameter.id) {
    return ContentService.createTextOutput(JSON.stringify(getRecordById(e.parameter.id)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  else if (e.parameter.action === 'search') {
    return ContentService.createTextOutput(JSON.stringify(searchRecordsByQuery(e.parameter)))
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

  const findIdCol = Object.keys(data).find(key => key.toLowerCase() === 'id');
  
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
    return ContentService.createTextOutput(JSON.stringify(updateRecord(data[findIdCol], data.data)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  else if (data.action === 'delete') {
    return ContentService.createTextOutput(JSON.stringify(deleteRecord(data[findIdCol])))
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
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const len = data.length;
  return len > 1 ? (data[len - 1][COLUMNS[findIdCol]] || 0) + 1 : 1;
}

/**
 * Convert row to record object
 */
function convertToRecord(row, id = undefined) {
  const record = {};
  for (let i = 0; i < Object.keys(COLUMNS).length; i++) {
    const key = Object.keys(COLUMNS)[i].toLowerCase();
    const findValCol = Object.keys(COLUMNS).find(keyRow => keyRow.toLowerCase() === key)
    if (key === 'id') {
      record['id'] = id !== undefined ? id : row[COLUMNS[findValCol]] || 1;
    } else if (key === 'created_at' || key === 'updated_at') {
      record[key] = row[COLUMNS[findValCol]] || new Date().toISOString();
    } else if (key === 'status') {
      record[key] = row[COLUMNS[findValCol]] || 0;
    } else {
      record[key] = row[COLUMNS[findValCol]] || '';
    }
  }
  return record;
}

/**
 * Convert record to row
 */
function convertToRow(record, id = undefined) {
  const row = {};
  for (let i = 0; i < Object.keys(COLUMNS).length; i++) {
    const key = Object.keys(COLUMNS)[i].toLowerCase();
    const findValCol = Object.keys(record).find(keyRecord => keyRecord.toLowerCase() === key)
    if ((!findValCol && key === 'id') ||findValCol.toLowerCase() === 'id') {
      row[findIdCol] = id !== undefined ? id : record[findValCol] || 1;
    } else if (key === 'created_at' || key === 'updated_at') {
      row[Object.keys(COLUMNS)[i]] = record[findValCol] || new Date().toISOString();
    } else if (key === 'status') {
      row[Object.keys(COLUMNS)[i]] = record[findValCol] || 0;
    } else {
      row[Object.keys(COLUMNS)[i]] = record[findValCol] || '';
    }
  }
  return row;
}

/**
 * Convert row to record object
 */
function rowToRecord(row) {
  if (!row || row.length < Object.keys(COLUMNS).length) {
    return null;
  }
  return convertToRecord(row);
}

/**
 * Convert record to row object
 */
function recordToRecordObject(record, id = undefined) {
  const findIdCol = Object.keys(record).find(key => key.toLowerCase() === 'id')
  if (!record || (!record[findIdCol] && id === undefined)) {
    return null;
  }

  return convertToRow(record, id);
}

/**
 * Create record to row 
 */
function createRow(recordData, id = undefined) {
  const newRecord = recordToRecordObject(recordData, id);
  return convertToRow(newRecord)
}

/**
 * Convert record to row array
 */
function objectValues(recordData) {
  const result = []
  for (let i = 0; i < Object.keys(recordData).length; i++) {
    result.push(recordData[Object.keys(recordData)[i]])
  }
  return result
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
      const findIdCol = Object.keys(record).find(key => key.toLowerCase() === 'id')
      if (record && record[findIdCol]) {
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
function getRecordById(id) {
  try {
    if (!id) {
      return { error: 'ID is required' };
    }
    
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const record = rowToRecord(data[i], i + 1);
      const findIdCol = Object.keys(record).find(key => key.toLowerCase() === 'id')
      if (record && record[findIdCol].toString() === id.toString()) {
        return { record: record };
      }
    }
    
    return { error: 'Record id ' + id + ' not found' };
  } catch (error) {
    return { error: 'Failed to fetch record: ' + error.toString() };
  }
}

/**
 * Search records by query with support for exact match and LIKE operator
 * 
 * The function supports two query formats:
 * 1. Exact match: field=value
 * 2. LIKE operator: field=%value% (contains), field=value% (starts with), field=%value (ends with)
 * 
 * @param {Object} query - The search query object with key-value pairs
 * @return {Object} Object with records array or error
 */
function searchRecordsByQuery(query) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const results = [];
    
    // Remove action from query if present
    if (Object.keys(query).findIndex(key => key.toLowerCase() === 'action') > -1) {
      delete query.action;
    }
    
    // Get the first search key and value
    const searchKey = Object.keys(query)[0]?.toLowerCase();
    let searchValue = objectValues(query)[0];
    
    if (!searchKey || searchValue === undefined) {
      return { error: 'Invalid search query' };
    }
    
    // Convert search value to string and lowercase for case-insensitive search
    searchValue = searchValue.toString().toLowerCase();
    
    // Determine search type based on presence of % characters
    let searchType = 'exact'; // Default to exact match
    let actualSearchValue = searchValue;
    
    if (searchValue.charAt(0) === '%' && searchValue.charAt(searchValue.length - 1) === '%') {
      // Contains pattern: %value%
      searchType = 'contains';
      actualSearchValue = searchValue.substring(1, searchValue.length - 1);
    } else if (searchValue.charAt(0) === '%') {
      // Ends with pattern: %value
      searchType = 'endsWith';
      actualSearchValue = searchValue.substring(1);
    } else if (searchValue.charAt(searchValue.length - 1) === '%') {
      // Starts with pattern: value%
      searchType = 'startsWith';
      actualSearchValue = searchValue.substring(0, searchValue.length - 1);
    }
    
    // Perform search based on search type
    for (let i = 1; i < data.length; i++) {
      const record = rowToRecord(data[i], i + 1);
      const fieldKey = Object.keys(record).find(key => key.toLowerCase() === searchKey);
      
      if (fieldKey && record) {
        const fieldValue = record[fieldKey].toString().toLowerCase();
        let isMatch = false;
        
        switch (searchType) {
          case 'exact':
            isMatch = fieldValue === actualSearchValue;
            break;
          case 'contains':
            isMatch = fieldValue.indexOf(actualSearchValue) !== -1;
            break;
          case 'startsWith':
            isMatch = fieldValue.indexOf(actualSearchValue) === 0;
            break;
          case 'endsWith':
            // Check if the field value ends with the search value
            const valueEndIdx = fieldValue.length - actualSearchValue.length;
            isMatch = valueEndIdx >= 0 && fieldValue.indexOf(actualSearchValue) === valueEndIdx;
            break;
        }
        
        if (isMatch) {
          results.push(record);
        }
      }
    }
    
    return { records: results };
  } catch (error) {
    return { error: 'Failed to search records: ' + error.toString() };
  }
}

/**
 * Create a new record
 */
function createRecord(recordData) {
  try {
    if (!recordData) {
      return { error: 'Record data is required' };
    }
    
    const sheet = getSheet();
    
    const newRecord = createRow(recordData, generateId())
    const row = objectValues(newRecord)
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

    let id = generateId();
    
    for (let i = 0; i < recordsData.length; i++) {
      const newRecord = createRow(recordsData[i], id)
      const row = objectValues(newRecord)
      
      batchData.push(row);
      
      createdRecords.push(newRecord);
      id++
    }
    
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
    
    if (!recordData) {
      return { error: 'Record data is required' };
    }
    
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const record = data[i]
      if (record[COLUMNS[findIdCol]] === id) {
        const updatedRecord = recordToRecordObject(recordData, id);
        const updateDate = Object.keys(updatedRecord).find(key => key.toLowerCase() === 'update_date')
        if (updateDate) {
          updatedRecord[updateDate] = new Date().toISOString();
        }
        
        const row = objectValues(updatedRecord);
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        
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
      const rowDataIndex = data.findIndex((row, index) => index > 0 && Number(row[COLUMNS[findIdCol]]) === Number(recordData.id))
      if (rowDataIndex > -1) {
        const updatedRecord = recordToRecordObject(recordData);
        const updateDate = Object.keys(updatedRecord).find(key => key.toLowerCase() === 'update_date')
        if (updateDate) {
          updatedRecord[updateDate] = new Date().toISOString();
        }

        modifyRecords.push(updatedRecord);
        
        const row = objectValues(updatedRecord);
        sheet.getRange(rowDataIndex + 1, 1, 1, row.length).setValues([row]);
      } else {
        const newRecord = createRow(recordData, generateId())
        const status = Object.keys(newRecord).find(key => key.toLowerCase() === 'status')
        if (status) {
          newRecord[status] = 1;
        }

        modifyRecords.push(newRecord);

        const row = objectValues(newRecord)
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
      const record = data[i]
      if (record[COLUMNS[findIdCol]] === id) {
        sheet.deleteRow(i + 1);
        return { record: record };
      }
    }
    
    return { error: 'Record ' + id + ' not found' };
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
