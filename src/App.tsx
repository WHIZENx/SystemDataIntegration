import React, { useState, useEffect, useRef } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { googleSheetsAPI } from './services/googleSheetsAPI';
import { neonAPI } from './services/neonAPI';
import RecordForm from './components/RecordForm';
import RecordList from './components/RecordList';
import ExportButtons from './components/ExportButtons';
import Navigation from './components/Navigation';
import ImageGallery from './pages/ImageGallery';
import FirebaseTest from './pages/FirebaseTest';
import LoadTestNavigator from './pages/LoadTestNavigator';
import { Record } from './models/record.model';
import { ApiType } from './enums/api-type.enum';
import { firebaseService } from './services/firebaseService';
import { AUTO_SEARCH_DELAY, DEFAULT_QUERY_TYPE, DEFAULT_RECORD, IS_AUTO_SEARCH } from './constants/default.constant';
import { appwriteService } from './services/appwriteService';
import { RecordAppwrite } from './models/app-write.model';

const App: React.FC = () => {
  const [init, setInit] = useState<boolean>(false);
  const [records, setRecords] = useState<Record[]>([]);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingCSV, setIsExportingCSV] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation and theme state
  const [activePage, setActivePage] = useState<string>('records');
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');

  const [apiType, setApiType] = useState(ApiType.GOOGLE_SHEETS);

  // Initialize theme based on localStorage when app loads
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load records on component mount
  useEffect(() => {
    if (activePage === 'records') {
      loadRecords(apiType);
    }
  }, [activePage]);

  // Create a ref to store the current cancel token
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  const loadRecords = async (loadApiType: ApiType): Promise<void> => {
    // Cancel any ongoing request
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Operation cancelled due to new request');
    }

    if (searchName.trim() && records.length > 0) {
      await searchRecords(searchName);
      return;
    }
    
    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    const cancelToken = cancelTokenRef.current.token;
    
    setLoading(true);
    setInit(false);
    setError('');
    setSuccess('');
    try {
      if (loadApiType === ApiType.NEON) {
        const data = await neonAPI.getAllRecords(cancelToken);
        setRecords(data);
      } else if (loadApiType === ApiType.FIREBASE) {
        const data = await firebaseService.getAllRecords();
        setRecords(data);
      } else if (loadApiType === ApiType.APPWRITE) {
        const data = await appwriteService.getAllRecords();
        setRecords(data);
      } else {
        const data = await googleSheetsAPI.getAllRecords(cancelToken);
        setRecords(data);
      }
    } catch (err: any) {
      // Don't show error when request was intentionally cancelled
      if (!axios.isCancel(err)) {
        setError('Failed to load records: ' + err.message);
      }
    } finally {
      setLoading(false);
      setInit(true);
    }
  };

  const searchRecords = async (name: string): Promise<void> => {
    if (!name.trim() || records.length === 0) {
      // If search is empty, load all records
      await loadRecords(apiType);
      return;
    }

    // Cancel any ongoing request
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Operation cancelled due to new request');
    }

    // Create a new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    const cancelToken = cancelTokenRef.current.token;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (apiType === ApiType.NEON) {
        const data = await neonAPI.searchRecords('name', name.trim(), cancelToken);
        setRecords(data);
      } else if (apiType === ApiType.FIREBASE) {
        const data = await firebaseService.searchRecords('name', name.trim(), DEFAULT_QUERY_TYPE);
        setRecords(data);
      } else if (apiType === ApiType.APPWRITE) {
        const data = await appwriteService.searchRecords('name', name.trim());
        setRecords(data);
      } else {
        const data = await googleSheetsAPI.searchRecords('name', name.trim(), cancelToken);
        setRecords(data);
      }
    } catch (err) {
      setError('Failed to search records: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Set up debounced search if auto-search is enabled
  useEffect(() => {
    if (IS_AUTO_SEARCH && searchName.trim()) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Set new timeout for search
      searchTimeoutRef.current = setTimeout(() => {
        searchRecords(searchName);
      }, AUTO_SEARCH_DELAY);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchName]);

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!searchName.trim()) {
      loadRecords(apiType);
      return;
    }
    
    setLoading(true);
    searchRecords(searchName);
  };

  const clearSearch = (): void => {
    setSearchName('');
    loadRecords(apiType);
  };

  const handleCreate = async (recordData: Omit<Record, 'id'>): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (apiType === ApiType.NEON) {
        await neonAPI.createRecord(recordData);
      } else if (apiType === ApiType.FIREBASE) {
        await firebaseService.createRecord(recordData);
      } else if (apiType === ApiType.APPWRITE) {
        await appwriteService.createRecord(recordData);
      } else {
        await googleSheetsAPI.createRecord(recordData);
      }
      setEditingRecord(null);
      await loadRecords(apiType); // Refresh the list
      setSuccess('Record created successfully');
    } catch (err) {
      setError('Failed to create record: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number | string, recordData: Omit<Record, 'id'>): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (apiType === ApiType.NEON) {
        await neonAPI.updateRecord(Number(id), recordData);
      } else if (apiType === ApiType.FIREBASE) {
        await firebaseService.updateRecord(Number(id), recordData);
      } else if (apiType === ApiType.APPWRITE) {
        await appwriteService.updateRecord(id, recordData);
      } else {
        await googleSheetsAPI.updateRecord(Number(id), recordData);
      }
      setEditingRecord(null);
      await loadRecords(apiType); // Refresh the list
      setSuccess('Record updated successfully');
    } catch (err) {
      setError('Failed to update record: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (apiType === ApiType.NEON) {
        await neonAPI.deleteRecord(Number(id));
      } else if (apiType === ApiType.FIREBASE) {
        await firebaseService.deleteRecord(Number(id));
      } else if (apiType === ApiType.APPWRITE) {
        await appwriteService.deleteRecord(id);
      } else {
        await googleSheetsAPI.deleteRecord(Number(id));
      }
      const record = records.find((record) => (apiType === ApiType.APPWRITE ? (record as RecordAppwrite).$id : record.id) === id);
      if (record && record.profile_image) {
        await appwriteService.deleteImage(record.profile_image);
      }
      await loadRecords(apiType); // Refresh the list
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
      if (apiType === ApiType.NEON) {
        await neonAPI.createDbEmployee();
      } else if (apiType === ApiType.FIREBASE) {
        await firebaseService.initDatabaseStructure();
      } else {
        await googleSheetsAPI.initSheet();
      }
      setSuccess('Employee table created successfully');
    } catch (err) {
      setError('Failed to create employee table: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Update the DOM
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  // Handle navigation between pages
  const handleNavigate = (page: string) => {
    // Cancel any ongoing request when navigating away
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Operation cancelled due to navigation');
      cancelTokenRef.current = null;
    }
    setActivePage(page);
  };

  const onSetApiType = (newApiType: ApiType) => {
    if (apiType !== newApiType) {
      // Cancel any ongoing request when switching API type
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Operation cancelled due to API type switch');
        cancelTokenRef.current = null;
      }
      setApiType(newApiType);
      setActivePage('records');
      loadRecords(newApiType);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 dark:text-white transition-colors duration-300">
      <Navigation 
        activePage={activePage} 
        onNavigate={handleNavigate}
        onThemeToggle={toggleTheme}
        isDarkMode={!darkMode}
      />
      
      <div className="container mx-auto px-4 py-8">
        {activePage === 'records' ? (
          <>
            {/* API Selection */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button 
                  onClick={() => onSetApiType(ApiType.GOOGLE_SHEETS)}
                  className={`px-4 py-2 text-sm font-medium border ${apiType === ApiType.GOOGLE_SHEETS ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white dark:border-gray-600 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'} rounded-l-lg`}
                >
                  Google Sheets
                </button>
                <button 
                  onClick={() => onSetApiType(ApiType.NEON)}
                  className={`px-4 py-2 text-sm font-medium border-t border-b ${apiType === ApiType.NEON ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white dark:border-gray-600 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                >
                  Neon DB
                </button>
                <button 
                  onClick={() => onSetApiType(ApiType.FIREBASE)}
                  className={`px-4 py-2 text-sm font-medium border ${apiType === ApiType.FIREBASE ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white dark:border-gray-600 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                >
                  Firebase
                </button>
                <button 
                  onClick={() => onSetApiType(ApiType.APPWRITE)}
                  className={`px-4 py-2 text-sm font-medium border ${apiType === ApiType.APPWRITE ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-white dark:border-gray-600 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'} rounded-r-lg`}
                >
                  Appwrite
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError('')}>
                  <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <title>Close</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                  </svg>
                </span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="mb-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{success}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccess('')}>
                  <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <title>Close</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                  </svg>
                </span>
              </div>
            )}
            
            {/* Search Form */}
            <div className="mb-6">
              <form onSubmit={handleSearchSubmit} className="flex">
                <input 
                  type="text" 
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full flex-grow px-4 py-2 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  className={`bg-blue-500 text-white px-6 py-2 ${IS_AUTO_SEARCH ? 'rounded-r-md' : ''} hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700 disabled:bg-blue-300`}
                  disabled={loading}
                >
                  Search
                </button>
                {!IS_AUTO_SEARCH && <button 
                  onClick={clearSearch}
                  className="bg-red-500 text-white px-6 py-2 rounded-r-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-700 disabled:bg-red-300"
                  disabled={loading}
                >
                  Clear
                </button>}
              </form>
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* Export Buttons */}
              <ExportButtons 
                apiType={apiType}
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
              {apiType !== ApiType.APPWRITE && <button
                onClick={handleCreateEmployeeTable}
                className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                disabled={loading}
              >
                Create Table
              </button>}
            </div>

            {/* Record List */}
            <RecordList
              apiType={apiType}
              records={records} 
              onEdit={handleEdit} 
              onDelete={handleDelete}
              loading={loading}
            />
            
            {/* Record Form */}
            <div className="mt-10">
              <div className="flex justify-between">
                <h2 className="text-2xl font-bold mb-4">{editingRecord ? 'Edit Record' : 'Add New Record'}</h2>
                {!editingRecord && <button
                  onClick={() => handleEdit(DEFAULT_RECORD)}
                  className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                  disabled={loading}
                >
                  Create mock data
                </button>}
              </div>
              <RecordForm 
                record={editingRecord}
                onSubmit={editingRecord ? 
                  (data) => handleUpdate(apiType === ApiType.APPWRITE ? (editingRecord as RecordAppwrite).$id : editingRecord.id, data) : 
                  handleCreate
                }
                onCancel={editingRecord ? handleCancelEdit : null}
                loading={loading}
                init={init}
              />
            </div>
          </>
        ) : activePage === 'gallery' ? (
          <ImageGallery activePage={activePage} />
        ) : activePage === 'load-test' ? (
          <LoadTestNavigator activePage={activePage} />
        ) : (
          <FirebaseTest activePage={activePage} />
        )}
      </div>
    </div>
  );
};

export default App;
