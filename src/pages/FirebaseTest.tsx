import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { Record } from '../models/record.model';
import { DEFAULT_QUERY_TYPE } from '../constants/default.constant';
import { QUERY_TYPE } from '../enums/query-type.enum';

/**
 * A test page to directly test Firebase CRUD operations
 */
const FirebaseTest: React.FC<{ activePage: string }> = ({ activePage }) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState<Record | null>(null);
  const [searchField, setSearchField] = useState('name');
  const [searchValue, setSearchValue] = useState('');
  
  // Initial load of records
  useEffect(() => {
    if (activePage === 'firebase') {
      loadRecords();
    }
  }, [activePage]);
  
  const loadRecords = async () => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const allRecords = await firebaseService.getAllRecords();
      setRecords(allRecords);
      setSuccess('Records loaded successfully');
      logSuccess('Loaded all records', allRecords);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`Error loading records: ${errorMessage}`);
      logError('Failed to load records', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateRecord = async () => {
    setError('');
    setSuccess('');
    const newRecord: Omit<Record, 'id'> = {
      name: `Test User ${Math.floor(Math.random() * 1000)}`,
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `+1${Math.floor(Math.random() * 10000000000)}`,
      department: ['HR', 'IT', 'Sales', 'Marketing'][Math.floor(Math.random() * 4)],
      position: ['Manager', 'Developer', 'Designer', 'Analyst'][Math.floor(Math.random() * 4)],
      profile_image: '',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    try {
      setLoading(true);
      const createdRecord = await firebaseService.createRecord(newRecord);
      setTestResult(createdRecord);
      setSuccess(`Record created with ID: ${createdRecord.id}`);
      logSuccess('Created record', createdRecord);
      
      // Refresh records list
      await loadRecords();
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`Error creating record: ${errorMessage}`);
      logError('Failed to create record', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGetRecord = async (id: number) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const record = await firebaseService.getRecordById(id);
      if (record) {
        setTestResult(record);
        setSuccess(`Record found: ${record.name}`);
        logSuccess('Found record by ID', record);
      } else {
        setError(`No record found with ID: ${id}`);
        setTestResult(null);
        logError('Record not found', { id });
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`Error getting record: ${errorMessage}`);
      logError('Failed to get record', err);
      setTestResult(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateRecord = async (record: Record) => {
    setError('');
    setSuccess('');
    // Update a random field
    const updatedRecord = { 
      ...record,
      name: `${record.name} (Updated at ${new Date().toLocaleTimeString()})` 
    };
    
    try {
      setLoading(true);
      const { id, ...updates } = updatedRecord;
      await firebaseService.updateRecord(id, updates);
      setTestResult(updatedRecord);
      setSuccess(`Record updated: ${updatedRecord.name}`);
      logSuccess('Updated record', updatedRecord);
      
      // Refresh records list
      await loadRecords();
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`Error updating record: ${errorMessage}`);
      logError('Failed to update record', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRecord = async (id: number) => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await firebaseService.deleteRecord(id);
      setTestResult(null);
      setSuccess(`Record with ID ${id} deleted successfully`);
      logSuccess('Deleted record', { id });
      
      // Refresh records list
      await loadRecords();
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`Error deleting record: ${errorMessage}`);
      logError('Failed to delete record', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async () => {
    setError('');
    setSuccess('');
    if (!searchField || !searchValue.trim()) {
      setError('Please enter a search field and value');
      return;
    }
    
    try {
      setLoading(true);
      const searchResults = await firebaseService.searchRecords(
        searchField as keyof Record, 
        searchValue,
        DEFAULT_QUERY_TYPE
      );
      
      setRecords(searchResults);
      if (searchResults.length > 0) {
        if (DEFAULT_QUERY_TYPE === QUERY_TYPE.CONTAINS) {
          setSuccess(`Found ${searchResults.length} records containing ${searchField} includes ${searchValue}`);
        } else {
          setSuccess(`Found ${searchResults.length} records matching ${searchField} = ${searchValue}`);
        }
        logSuccess('Search results', searchResults);
      } else {
        if (DEFAULT_QUERY_TYPE === QUERY_TYPE.CONTAINS) {
          setError(`No records found containing ${searchField} includes ${searchValue}`);
        } else {
          setError(`No records found matching ${searchField} = ${searchValue}`);
        }
        logError('No search results', { field: searchField, value: searchValue });
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`Error searching records: ${errorMessage}`);
      logError('Failed to search records', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRunAllTests = async () => {
    setLoading(true);
    setError('');
    setSuccess('Running all tests...');
    
    try {
      // 1. Test getAllRecords
      const allRecords = await firebaseService.getAllRecords();
      logSuccess('1. getAllRecords test passed', { count: allRecords.length });
      
      // 2. Test createRecord
      const newRecord: Omit<Record, 'id'> = {
        name: `Test User ${Math.floor(Math.random() * 1000)}`,
        email: `test${Math.floor(Math.random() * 1000)}@example.com`,
        phone: `+1${Math.floor(Math.random() * 10000000000)}`,
        department: 'Test Department',
        position: 'Test Position',
        profile_image: '',
        status: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const createdRecord = await firebaseService.createRecord(newRecord);
      logSuccess('2. createRecord test passed', createdRecord);
      
      // 3. Test getRecordById
      const foundRecord = await firebaseService.getRecordById(createdRecord.id);
      if (foundRecord && foundRecord.id === createdRecord.id) {
        logSuccess('3. getRecordById test passed', foundRecord);
      } else {
        throw new Error('getRecordById test failed - record not found or ID mismatch');
      }
      
      // 4. Test updateRecord
      const updatedRecord = { ...createdRecord, name: 'Updated Test User' };
      const { id, ...updates } = updatedRecord;
      await firebaseService.updateRecord(id, updates);
      const checkUpdatedRecord = await firebaseService.getRecordById(createdRecord.id);
      if (checkUpdatedRecord && checkUpdatedRecord.name === 'Updated Test User') {
        logSuccess('4. updateRecord test passed', checkUpdatedRecord);
      } else {
        throw new Error('updateRecord test failed - record not updated correctly');
      }
      
      // 5. Test searchRecords
      const searchResults = await firebaseService.searchRecords('name', 'Updated Test User', DEFAULT_QUERY_TYPE);
      if (searchResults.length > 0 && searchResults.some(r => r.id === createdRecord.id)) {
        logSuccess('5. searchRecords test passed', searchResults);
      } else {
        throw new Error('searchRecords test failed - search returned no results');
      }
      
      // 6. Test deleteRecord
      await firebaseService.deleteRecord(createdRecord.id);
      const shouldBeNull = await firebaseService.getRecordById(createdRecord.id);
      if (!shouldBeNull) {
        logSuccess('6. deleteRecord test passed', { id: createdRecord.id });
      } else {
        throw new Error('deleteRecord test failed - record still exists after deletion');
      }
      
      setSuccess('All tests passed successfully!');
      
      // Refresh records list
      await loadRecords();
      
    } catch (err) {
      const errorMessage = (err as Error).message;
      setSuccess('');
      setError(`Test failed: ${errorMessage}`);
      logError('Test failure', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to log success with timestamp
  const logSuccess = (message: string, data: any) => {
    console.log(
      `%c✅ ${message} (${new Date().toLocaleTimeString()})`, 
      'background: #e6ffe6; color: #006600; padding: 4px; border-radius: 4px;', 
      data
    );
  };
  
  // Helper function to log error with timestamp
  const logError = (message: string, error: any) => {
    console.error(
      `%c❌ ${message} (${new Date().toLocaleTimeString()})`, 
      'background: #ffe6e6; color: #cc0000; padding: 4px; border-radius: 4px;', 
      error
    );
  };

  return (
    <div className="container mx-auto p-4 dark:text-white">
      <h1 className="text-2xl font-bold mb-6">Firebase CRUD Service Test</h1>
      
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-blue-700 dark:text-blue-300">This page is for testing the Firebase CRUD service methods. Check the browser console for detailed test logs.</p>
      </div>
      
      {/* Status messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
          <div className="flex justify-between">
            <p>{error}</p>
            <button onClick={() => setError('')} className="text-red-500">×</button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg">
          <div className="flex justify-between">
            <p>{success}</p>
            <button onClick={() => setSuccess('')} className="text-green-500">×</button>
          </div>
        </div>
      )}
      
      {/* Test buttons */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Individual Methods</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreateRecord}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              Create Record
            </button>
            
            <button
              onClick={loadRecords}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              Get All Records
            </button>
            
            <button
              onClick={handleRunAllTests}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              Run All Tests
            </button>
          </div>
          
          {/* Test result display */}
          {testResult && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Current Records</h3>
              <div className="bg-white dark:bg-gray-900 p-3 rounded border dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-sm overflow-auto dark:text-gray-300">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
        
        {/* Search form */}
        <div className="mb-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700">
          <h3 className="text-lg font-medium mb-2 dark:text-gray-200">Test Results</h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <select 
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="department">Department</option>
                <option value="position">Position</option>
              </select>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full border rounded px-3 py-2 flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder={`Search by ${searchField}...`}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              Search
            </button>
          </div>
        </div>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      )}
      
      {/* Records table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow overflow-auto max-h-96 border dark:border-gray-700">
        <h2 className="text-xl font-semibold p-4 border-b dark:border-gray-700">
          Records ({records.length})
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{record.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{record.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{record.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGetRecord(record.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleUpdateRecord(record)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete record #${record.id}?`)) {
                              handleDeleteRecord(record.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTest;
