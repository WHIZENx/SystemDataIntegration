import React, { useState, useEffect } from 'react';
import { ApiType } from '../enums/api-type.enum';
import { 
  loadTestService, 
  ServiceLoadTestResults, 
  LoadTestResult, 
  PerformanceThresholds 
} from '../services/loadTestService';

interface LoadTestNavigatorProps {
  activePage: string;
}

const LoadTestNavigator: React.FC<LoadTestNavigatorProps> = ({ activePage }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ApiType | 'all'>(ApiType.GOOGLE_SHEETS);
  const [currentTestResults, setCurrentTestResults] = useState<ServiceLoadTestResults | ServiceLoadTestResults[]>();
  const [historicalResults, setHistoricalResults] = useState<ServiceLoadTestResults[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [thresholds, setThresholds] = useState<PerformanceThresholds>(loadTestService.getThresholds());

  // Load historical results on component mount
  useEffect(() => {
    if (activePage === 'load-test') {
      const savedResults = loadTestService.getStoredResults();
      setHistoricalResults(savedResults);
    }
  }, [activePage]);

  const handleRunTest = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setCurrentTestResults(undefined);
    
    try {
      let results;
      
      if (selectedService === 'all') {
        results = await loadTestService.testAllServices();
        setSuccess('Successfully ran load tests for all services');
      } else {
        results = await loadTestService.testServiceByType(selectedService);
        setSuccess(`Successfully ran load test for ${getServiceName(selectedService)}`);
      }
      
      setCurrentTestResults(results);
      setHistoricalResults(loadTestService.getStoredResults());
    } catch (err) {
      setError(`Error running load test: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateThresholds = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loadTestService.setThresholds(thresholds);
    setSuccess('Performance thresholds updated');
  };

  const handleClearHistory = () => {
    loadTestService.clearStoredResults();
    setHistoricalResults([]);
    setSuccess('Test history cleared');
  };

  const getServiceName = (apiType: ApiType): string => {
    switch (apiType) {
      case ApiType.GOOGLE_SHEETS:
        return 'Google Sheets API';
      case ApiType.APPWRITE:
        return 'Appwrite Service';
      case ApiType.FIREBASE:
        return 'Firebase Service';
      case ApiType.NEON:
        return 'NEON API';
      default:
        return 'Unknown Service';
    }
  };

  // Get color class based on performance rating
  const getPerformanceColorClass = (executionTime: number): string => {
    const rating = loadTestService.getPerformanceRating(executionTime);
    
    switch (rating) {
      case 'excellent':
        return 'text-green-500 dark:text-green-400';
      case 'good':
        return 'text-blue-500 dark:text-blue-400';
      case 'low':
        return 'text-red-500 dark:text-red-400';
      default:
        return '';
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  // Format time in ms for display
  const formatTime = (time: number): string => {
    return `${time.toFixed(2)} ms`;
  };

  // Render single test result
  const renderTestResult = (result: LoadTestResult) => {
    return (
      <div 
        key={result.functionName} 
        className="p-3 border-b dark:border-gray-700 flex justify-between items-center"
      >
        <span className="font-medium">{result.functionName}</span>
        {result.success ? (
          <span className={getPerformanceColorClass(result.executionTime)}>
            {formatTime(result.executionTime)}
          </span>
        ) : (
          <span className="text-red-500 dark:text-red-400">Failed: {result.error}</span>
        )}
      </div>
    );
  };

  // Render service results
  const renderServiceResults = (serviceResults: ServiceLoadTestResults) => {
    return (
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-md shadow-md p-4">
        <h3 className="text-xl font-bold mb-2">{serviceResults.serviceName}</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Test run: {formatDate(serviceResults.timestamp)}
        </div>
        
        {/* Summary stats */}
        <div className="flex gap-6 mb-4 text-sm">
          <div>
            <span className="font-medium">Average:</span> {' '}
            <span className={getPerformanceColorClass(serviceResults.averageTime || 0)}>
              {formatTime(serviceResults.averageTime || 0)}
            </span>
          </div>
          <div>
            <span className="font-medium">Total:</span> {' '}
            <span>{formatTime(serviceResults.totalTime || 0)}</span>
          </div>
          <div>
            <span className="font-medium">Tests:</span> {' '}
            <span>{serviceResults.results.length}</span>
          </div>
          <div>
            <span className="font-medium">Success:</span> {' '}
            <span>{serviceResults.results.filter(r => r.success).length}/{serviceResults.results.length}</span>
          </div>
        </div>
        
        {/* Individual test results */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded border dark:border-gray-700">
          {serviceResults.results.map(renderTestResult)}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Load Test Navigator</h1>
      
      {/* Error and success messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded">
          {success}
        </div>
      )}
      
      {/* Test controls */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-md shadow-md p-4">
        <h2 className="text-lg font-bold mb-4">Run Load Tests</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Service
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(Number(e.target.value) || 'all')}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            >
              <option value="all">All Services</option>
              <option value={ApiType.GOOGLE_SHEETS}>Google Sheets API</option>
              <option value={ApiType.APPWRITE}>Appwrite Service</option>
              <option value={ApiType.FIREBASE}>Firebase Service</option>
              <option value={ApiType.NEON}>NEON API</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleRunTest}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 w-full"
            >
              {loading ? 'Running...' : 'Run Test'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Performance thresholds */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-md shadow-md p-4">
        <h2 className="text-lg font-bold mb-4">Performance Thresholds (ms)</h2>
        
        <form onSubmit={handleUpdateThresholds}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Excellent (below)
              </label>
              <input
                type="number"
                value={thresholds.excellent}
                name="excellent"
                min={thresholds.good + 1}
                onChange={(e) => setThresholds({...thresholds, excellent: Number(e.target.value)})}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={loading}
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Good (below)
              </label>
              <input
                type="number"
                value={thresholds.good}
                name="good"
                min={thresholds.low + 1}
                max={thresholds.excellent - 1}
                onChange={(e) => setThresholds({...thresholds, good: Number(e.target.value)})}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={loading}
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Low (above)
              </label>
              <input
                type="number"
                value={thresholds.low}
                name="low"
                min={0}
                max={thresholds.good - 1}
                onChange={(e) => setThresholds({...thresholds, low: Number(e.target.value)})}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={loading}
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 w-full"
              >
                Update
              </button>
            </div>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-center gap-6 mt-2">
            <span className="text-green-500 dark:text-green-400">Excellent: &lt; {thresholds.excellent}ms</span>
            <span className="text-blue-500 dark:text-blue-400">Good: {thresholds.excellent}ms - {thresholds.good}ms</span>
            <span className="text-red-500 dark:text-red-400">Low: &gt; {thresholds.low}ms</span>
          </div>
        </div>
      </div>
      
      {/* Current test results */}
      {currentTestResults && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Current Test Results</h2>
          
          {Array.isArray(currentTestResults) ? (
            currentTestResults.map((result, index) => (
              <div key={index}>
                {renderServiceResults(result)}
              </div>
            ))
          ) : (
            renderServiceResults(currentTestResults)
          )}
        </div>
      )}
      
      {/* Historical results */}
      {historicalResults.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Test History</h2>
            
            <button
              onClick={handleClearHistory}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Clear History
            </button>
          </div>
          
          <div className="space-y-4">
            {historicalResults.slice().reverse().map((result, index) => (
              <div key={index} className="border dark:border-gray-700 rounded-md p-3">
                <div className="flex justify-between">
                  <h3 className="font-bold">{result.serviceName}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(result.timestamp)}
                  </span>
                </div>
                
                <div className="mt-2 flex gap-4 text-sm">
                  <div>
                    <span className="font-medium">Avg:</span> {' '}
                    <span className={getPerformanceColorClass(result.averageTime || 0)}>
                      {formatTime(result.averageTime || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Tests:</span> {' '}
                    <span>{result.results.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Success:</span> {' '}
                    <span>{result.results.filter(r => r.success).length}/{result.results.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadTestNavigator;
