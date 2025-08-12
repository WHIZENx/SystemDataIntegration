# Service CRUD Test Documentation

## Overview
This document explains how to use the Service CRUD test page to verify the functionality of Service database operations in the SystemDataIntegration application.

## Accessing the Test Page
The Service Test page is accessible through the main navigation:

1. Launch the application (`npm start`)
2. Click on the "Service Test" button in the navigation bar
3. The test page will load showing various test options

## Test Features

### Individual CRUD Operations

The Service Test page allows you to test each CRUD operation individually:

#### Create Record
Tests the creation of a new employee record in Service:
- Automatically generates a test record with a timestamp for uniqueness
- Displays the created record data and ID in the results area
- Logs success/failure status to the console and UI

#### Get Record
Tests retrieving a specific record by ID:
- Requires a valid record ID (you can use an ID from a previously created record)
- Displays the retrieved record details
- Logs success/failure status

#### Update Record
Tests updating an existing record:
- Requires a valid record object (you can use a previously retrieved record)
- Updates the record name with a timestamp to verify the change
- Displays the updated record after completion
- Logs success/failure status

#### Delete Record
Tests deleting a record by ID:
- Requires a valid record ID
- Confirms successful deletion
- Logs success/failure status

### Search Records
Tests the search functionality:
- Enter a field name (e.g., "name", "department") and value to search
- Displays all matching records
- Logs success/failure status

### Run All Tests
Performs a complete test cycle automatically:
1. Creates a test record
2. Retrieves the created record
3. Searches for the record
4. Updates the record
5. Deletes the record
6. Logs each step with success/failure status

## Test Console

The test page includes a console area that displays:
- Detailed logs for each operation
- JSON representation of test results
- Success messages (green) and error messages (red)
- Timestamps for each operation

## Troubleshooting

If you encounter issues while testing:

1. **Service Configuration**: Ensure your Service configuration in environment variables is correct
2. **Network Connectivity**: Verify you have an active internet connection
3. **Console Errors**: Check the browser console for detailed error messages
4. **Test Records**: If tests fail because records don't exist, try creating a record first

## Best Practices

- Run the "Run All Tests" option first to verify the complete workflow
- Use individual tests for debugging specific functionality
- Clear test records after testing to avoid database clutter
- Use this page during development to verify service changes

---

For more details on the services implementation, refer to:
- `src/services/firebaseService.ts` - CRUD operations implementation
- `src/config/firebase.config.ts` - Firebase configuration
