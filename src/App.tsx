import React, { useState, useEffect, useRef } from 'react';
import { GoogleSheetsAPI } from './services/googleSheetsAPI';
import { NeonAPI } from './services/neonAPI';
import RecordForm from './components/RecordForm';
import RecordList from './components/RecordList';
import ExportButtons from './components/ExportButtons';
import { Record } from './models/record.model';
import { ApiType } from './enums/api-type.enum';
import { firebaseService } from './services/firebaseService';
import { AUTO_SEARCH_DELAY, IS_AUTO_SEARCH } from './constants/default.constant';

const App: React.FC = () => {
  const [init, setInit] = useState<boolean>(false);
  const [records, setRecords] = useState<Record[]>([]);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingCSV, setIsExportingCSV] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const apiType = useRef(ApiType.GOOGLE_SHEETS);

  // Load records on component mount
  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async (): Promise<void> => {
    setLoading(true);
    setInit(false);
    setError('');
    setSuccess('');
    try {
      if (apiType.current === ApiType.NEON) {
        const data = await NeonAPI.getAllEmployees();
        setRecords(data);
      } else if (apiType.current === ApiType.FIREBASE) {
        const data = await firebaseService.getAllRecords();
        setRecords(data);
      } else {
        const data = await GoogleSheetsAPI.getAllRecords();
        setRecords(data);
      }
    } catch (err) {
      setError('Failed to load records: ' + (err as Error).message);
    } finally {
      setLoading(false);
      setInit(true);
    }
  };

  const searchEmployees = async (name: string): Promise<void> => {
    if (!name.trim()) {
      // If search is empty, load all records
      await loadRecords();
      return;
    }

    setIsSearching(true);
    setError('');
    setSuccess('');
    try {
      if (apiType.current === ApiType.NEON) {
        const data = await NeonAPI.searchEmployees({ name: name.trim() });
        setRecords(data);
      } else if (apiType.current === ApiType.FIREBASE) {
        const data = await firebaseService.findRecordsByField('name', name.trim());
        setRecords(data);
      } else {
        // For Google Sheets, filter locally
        const allData = await GoogleSheetsAPI.getAllRecords();
        const filtered = allData.filter(record => 
          record.name.toLowerCase().includes(name.toLowerCase())
        );
        setRecords(filtered);
      }
    } catch (err) {
      setError('Failed to search records: ' + (err as Error).message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setSearchName(value);
    
    if (IS_AUTO_SEARCH) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Debounce search - search after user stops typing for 500ms
      searchTimeoutRef.current = setTimeout(() => {
        searchEmployees(value);
      }, AUTO_SEARCH_DELAY);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    searchEmployees(searchName);
  };

  const clearSearch = (): void => {
    setSearchName('');
    loadRecords();
  };

  // Search and export functionality are now handled by dedicated components

  const handleCreate = async (recordData: Omit<Record, 'id'>): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (apiType.current === ApiType.NEON) {
        await NeonAPI.createEmployee(recordData);
      } else if (apiType.current === ApiType.FIREBASE) {
        await firebaseService.createRecord(recordData);
      } else {
        await GoogleSheetsAPI.createRecord(recordData);
      }
      await loadRecords(); // Refresh the list
      setSuccess('Record created successfully');
    } catch (err) {
      setError('Failed to create record: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number, recordData: Omit<Record, 'id'>): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (apiType.current === ApiType.NEON) {
        await NeonAPI.updateEmployee(id, recordData);
      } else if (apiType.current === ApiType.FIREBASE) {
        await firebaseService.updateRecord(id, recordData);
      } else {
        await GoogleSheetsAPI.updateRecord(id, recordData);
      }
      setEditingRecord(null);
      await loadRecords(); // Refresh the list
      setSuccess('Record updated successfully');
    } catch (err) {
      setError('Failed to update record: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (apiType.current === ApiType.NEON) {
        await NeonAPI.deleteEmployee(id);
      } else if (apiType.current === ApiType.FIREBASE) {
        await firebaseService.deleteRecord(id);
      } else {
        await GoogleSheetsAPI.deleteRecord(id);
      }
      await loadRecords(); // Refresh the list
      setSuccess('Record deleted successfully');
    } catch (err) {
      setError('Failed to delete record: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Record): void => {
    setEditingRecord(record);
  };

  const handleCancelEdit = (): void => {
    setEditingRecord(null);
  };

  const handleCreateEmployeeTable = async (): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (apiType.current === ApiType.NEON) {
        await NeonAPI.createDbEmployee();
      } else {
        await GoogleSheetsAPI.initSheet();
      }
      setSuccess('Employee table created successfully');
    } catch (err) {
      setError('Failed to create employee table: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{apiType.current === ApiType.NEON ? 'NEON Database' : 'Google Sheets'} CRUD</h1>
          <p className="mt-2 text-gray-600">Manage your data with Create, Read, Update, Delete operations
          <a className="ml-2 text-blue-600 hover:text-blue-800 underline cursor-pointer" onClick={handleCreateEmployeeTable}>Create Employee table</a></p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
            <span>{error}</span>
            <span className="cursor-pointer text-gray-600 hover:text-gray-800" onClick={() => setError('')}>x</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center justify-between">
            <span>{success}</span>
            <span className="cursor-pointer text-gray-600 hover:text-gray-800" onClick={() => setSuccess('')}>x</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {editingRecord ? 'Edit Record' : 'Add New Record'}
              </h2>
              <RecordForm
                record={editingRecord}
                onSubmit={editingRecord ? 
                  (data) => handleUpdate(editingRecord.id, data) : 
                  handleCreate
                }
                onCancel={editingRecord ? handleCancelEdit : null}
                loading={loading}
                init={init}
              />
            </div>
          </div>

          {/* Records List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Records ({records.length})</h2>
                  <div className="flex gap-2">
                    <ExportButtons
                      apiType={apiType.current}
                      records={records}
                      loading={loading}
                      isExporting={isExporting}
                      isExportingExcel={isExportingExcel}
                      isExportingCSV={isExportingCSV}
                      setIsExporting={setIsExporting}
                      setIsExportingExcel={setIsExportingExcel}
                      setIsExportingCSV={setIsExportingCSV}
                      setError={setError}
                      setSuccess={setSuccess}
                    />
                    <button
                      onClick={loadRecords}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      disabled={loading}
                    >
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                
                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="mb-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchName}
                        onChange={handleSearchChange}
                        placeholder="Search by employee name..."
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        disabled={loading || isSearching}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={loading || isSearching}
                      onClick={handleSearchSubmit}
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                    {searchName && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={loading || isSearching}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>
              </div>
              <RecordList
                records={records}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
