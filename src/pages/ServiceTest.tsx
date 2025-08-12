import React, { useState, useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';
import { firebaseService } from '../services/firebaseService';
import { appwriteService } from '../services/appwriteService';
import { googleSheetsAPI } from '../services/googleSheetsAPI';
import { neonAPI } from '../services/neonAPI';
import { Record } from '../models/record.model';
import { QUERY_TYPE } from '../enums/query-type.enum';
import { RecordAppwrite } from '../models/app-write.model';
import { neonRawAPI } from '../services/neonRawAPI';
import { SELECT_DEPARTMENT } from '../constants/default.constant';

// Service type definition
type ServiceType = 'googlesheets' | 'neon' | 'neonraw' | 'firebase' | 'appwrite' ;

// Map of service names for display
const SERVICE_NAMES = {
  googlesheets: 'Google Sheets',
  neon: 'Neon Database',
  neonraw: 'Neon Database Raw',
  firebase: 'Firebase',
  appwrite: 'Appwrite',
};

// Interface for unified service operations
interface ServiceInterface {
  getAllRecords: () => Promise<Record[]>;
  getRecordById: (id: number | string | any) => Promise<Record | null>;
  createRecord: (data: Omit<Record, 'id'>) => Promise<Record>;
  updateRecord: (id: number | string | any, data: any) => Promise<Record>;
  deleteRecord: (id: number | string | any) => Promise<any>;
  searchRecords: (field: keyof Record, value: string, matchType?: any) => Promise<Record[]>;
}

/**
 * A test page for testing CRUD operations across different services
 */
const ServiceTest: React.FC<{ activePage: string }> = ({ activePage }) => {
  const { showConfirmation } = useModal();
  // State
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState<Record | null>(null);
  const [searchField, setSearchField] = useState('name');
  const [searchValue, setSearchValue] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('googlesheets');

  // Get the currently selected service
  const getService = (): ServiceInterface => {
    switch (serviceType) {
      case 'firebase':
        return firebaseService;
      case 'appwrite':
        return appwriteService;
      case 'googlesheets':
        return googleSheetsAPI;
      case 'neon':
        return neonAPI;
      case 'neonraw':
        return neonRawAPI;
      default:
        return googleSheetsAPI;
    }
  };
  
  // Initial load of records
  useEffect(() => {
    if (activePage === 'service-test') {
      loadRecords();
    }
  }, [activePage]);

  useEffect(() => {
    loadRecords();
    setTestResult(null);
  }, [serviceType]);
  
  const loadRecords = async () => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      const service = getService();
      const allRecords = await service.getAllRecords();
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
    const service = getService();
    const newRecord: Omit<Record, 'id'> = {
      name: `Test User ${Math.floor(Math.random() * 1000)}`,
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      phone: `+1${Math.floor(Math.random() * 10000000000)}`,
      department: SELECT_DEPARTMENT[Math.floor(Math.random() * SELECT_DEPARTMENT.length)].value,
      position: ['Manager', 'Developer', 'Designer', 'Analyst'][Math.floor(Math.random() * 4)],
      profile_image: '',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    try {
      setLoading(true);
      const createdRecord = await service.createRecord(newRecord);
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
  
  const handleGetRecord = async (id: number | string) => {
    setError('');
    setSuccess('');
    const service = getService();
    try {
      setLoading(true);
      const record = await service.getRecordById(id);
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
  
  const handleUpdateRecord = async (updatedRecord: Record | RecordAppwrite) => {
    setError('');
    setSuccess('');
    const service = getService();

    try {
      setLoading(true);
      const { id, ...updates } = updatedRecord;
      await service.updateRecord(serviceType === 'appwrite' ? (updatedRecord as RecordAppwrite).$id : id, updates);
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
  
  const handleDeleteRecord = async (id: number | string) => {
    setError('');
    setSuccess('');
    const service = getService();
    try {
      setLoading(true);
      await service.deleteRecord(id);
      setSuccess(`Record deleted: ${id}`);
      logSuccess('Deleted record', { id });
      setTestResult(null);
      
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
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const service = getService();
    if (!searchField || !searchValue) {
      setError('Please enter a search field and value');
      return;
    }
    
    try {
      setLoading(true);
      const searchResults = await service.searchRecords(
        searchField as keyof Record, 
        searchValue,
        serviceType === 'appwrite' ? QUERY_TYPE.CONTAINS : undefined
      );
      
      if (searchResults.length > 0) {
        setRecords(searchResults);
        setSuccess(`Found ${searchResults.length} records matching "${searchValue}" in ${searchField}`);
        logSuccess('Search results', searchResults);
      } else {
        setRecords([]);
        setError(`No records found matching "${searchValue}" in ${searchField}`);
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
    setError('');
    setSuccess('');
    setLoading(true);
    const service = getService();
    
    try {
      const testRecords: Record[] = [];
      const results: any[] = [];
      
      // Test 1: Create a new record
      console.log('Test 1: Creating a new record...');
      const newRecord: Omit<Record, 'id'> = {
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        phone: `+1${Math.floor(Math.random() * 10000000000)}`,
        department: 'Test Department',
        position: 'Test Position',
        profile_image: '',
        status: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const createdRecord = await service.createRecord(newRecord);
      testRecords.push(createdRecord);
      results.push({ test: 'Create Record', result: 'Success', id: createdRecord.id });
      console.log('Created record:', createdRecord);
      
      // Test 2: Get the created record
      console.log('Test 2: Retrieving the created record...');
      const retrievedRecord = await service.getRecordById(createdRecord.id);
      if (retrievedRecord && retrievedRecord.id === createdRecord.id) {
        results.push({ test: 'Get Record', result: 'Success', id: retrievedRecord.id });
      } else {
        results.push({ test: 'Get Record', result: 'Failed', error: 'Record not found or ID mismatch' });
      }
      console.log('Retrieved record:', retrievedRecord);
      
      // Test 3: Update the record
      console.log('Test 3: Updating the record...');
      const updateData = {
        ...retrievedRecord,
        name: `${retrievedRecord?.name} (Updated)`,
        updated_at: new Date().toISOString(),
      };
      
      const { id, ...updates } = updateData;
      await service.updateRecord(serviceType === 'appwrite' ? (updateData as RecordAppwrite).$id : id, updates);
      results.push({ test: 'Update Record', result: 'Success', id: createdRecord.id });
      console.log('Updated record');
      
      // Test 4: Search for the record
      console.log('Test 4: Searching for the updated record...');
      const searchResults = await service.searchRecords('name', 'Updated', QUERY_TYPE.CONTAINS);
      if (searchResults.some(r => r.id === createdRecord.id)) {
        results.push({ test: 'Search Records', result: 'Success', count: searchResults.length });
      } else {
        results.push({ test: 'Search Records', result: 'Failed', error: 'Record not found in search results' });
      }
      console.log('Search results:', searchResults);
      
      // Test 5: Delete the record
      console.log('Test 5: Deleting the record...');
      await service.deleteRecord(createdRecord.id);
      results.push({ test: 'Delete Record', result: 'Success', id: createdRecord.id });
      console.log('Deleted record');
      
      // Final check: Verify record was deleted
      console.log('Test 6: Verifying record was deleted...');
      try {
        const deletedRecord = await service.getRecordById(serviceType === 'appwrite' ? (createdRecord as RecordAppwrite).$id : createdRecord.id);
        if (!deletedRecord) {
          results.push({ test: 'Verify Deletion', result: 'Success' });
        } else {
          results.push({ test: 'Verify Deletion', result: 'Failed', error: 'Record still exists after deletion' });
        }
      } catch (error) {
        // If getting a deleted record throws an error, that's also successful deletion
        results.push({ test: 'Verify Deletion', result: 'Success', note: 'Deletion confirmed by error' });
      }
      
      // Show test results
      setSuccess(`All tests completed. ${results.filter(r => r.result === 'Success').length} of ${results.length} tests passed.`);
      console.log('Test Results:', results);
      logSuccess('Test Results', results);
      
      // Refresh records list
      await loadRecords();
      
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(`Test run failed: ${errorMessage}`);
      logError('Test run failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to log success with timestamp
  const logSuccess = (message: string, data: any) => {
    console.log(`✅ ${new Date().toISOString()} - ${message}:`, data);
  };
  
  // Helper function to log error with timestamp
  const logError = (message: string, error: any) => {
    console.error(`❌ ${new Date().toISOString()} - ${message}:`, error);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Data Service Test</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test CRUD operations with different data services
        </p>
      </div>
      
      {/* Service selector */}
      <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Select Service</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {(Object.keys(SERVICE_NAMES) as ServiceType[]).map((type) => (
            <button
              key={type}
              onClick={() => setServiceType(type)}
              className={`p-3 rounded-lg transition-all duration-200 ${
                serviceType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {SERVICE_NAMES[type]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Status messages */}
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 dark:bg-red-900 dark:text-red-100 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 dark:bg-green-900 dark:text-green-100 rounded">
          <p>{success}</p>
        </div>
      )}
      
      {/* Operation buttons */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Operations</h2>
          <div className="space-y-3">
            <button
              onClick={handleCreateRecord}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow transition-colors disabled:bg-blue-300"
              disabled={loading}
            >
              Create Random Record
            </button>
            
            <button
              onClick={handleRunAllTests}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded shadow transition-colors disabled:bg-purple-300"
              disabled={loading}
            >
              Run All Tests
            </button>
            
            <button
              onClick={loadRecords}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded shadow transition-colors disabled:bg-green-300"
              disabled={loading}
            >
              Refresh Records
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Search Records</h2>
          <form onSubmit={handleSearch}>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="w-1/3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
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
                  placeholder="Search value"
                  className="w-2/3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow transition-colors disabled:bg-blue-300"
                disabled={loading}
              >
                Search
              </button>
            </div>
          </form>
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
          Records ({records.length}) - {SERVICE_NAMES[serviceType]}
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
                          onClick={() => handleGetRecord(serviceType === 'appwrite' ? (record as RecordAppwrite).$id : record.id)}
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
                          onClick={async () => {
                            const confirmed = await showConfirmation({
                              title: 'Confirm Deletion',
                              message: `Are you sure you want to delete record #${record.id}?`,
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              type: 'danger'
                            });
                            
                            if (confirmed) {
                              handleDeleteRecord(serviceType === 'appwrite' ? (record as RecordAppwrite).$id : record.id);
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
      
      {/* Test result display */}
      {testResult && (
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Test Result</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-60 text-sm">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ServiceTest;
