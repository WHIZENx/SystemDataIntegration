// Load Test Service
// This service handles load testing for all services

import { googleSheetsAPI } from './googleSheetsAPI';
import { appwriteService } from './appwriteService';
import { firebaseService } from './firebaseService';
import { neonAPI } from './neonAPI';
import { ApiType } from '../enums/api-type.enum';
import { Record } from '../models/record.model';
import { RecordAppwrite } from '../models/app-write.model';

// Performance metrics for load testing
export interface LoadTestResult<T = any> {
  functionName: string;
  executionTime: number; // in milliseconds
  success: boolean;
  error?: string;
  data?: T; // Store T returned data if needed for subsequent tests
}

export interface ServiceLoadTestResults<T = any> {
  serviceName: string;
  results: LoadTestResult<T>[];
  averageTime?: number; // Average execution time
  totalTime?: number; // Total execution time
  timestamp: string; // When the test was run
}

// Breakpoint thresholds for performance evaluation
export interface PerformanceThresholds {
  low: number; // milliseconds - anything above this is considered "low" performance
  good: number; // milliseconds - anything below this is considered "good" performance
  excellent: number; // milliseconds - anything below this is considered "excellent" performance
}

// Default thresholds (can be customized by user)
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  low: 1000, // Over 1000ms is considered low performance
  good: 500, // Under 500ms is considered good performance
  excellent: 200, // Under 200ms is considered excellent performance
};

// Mock data for testing
const mockRecordData: Omit<Record, 'id'> = {
  name: 'Load Test User',
  email: 'loadtest@example.com',
  phone: '555-0000',
  department: 'Testing',
  position: 'Load Tester',
  profile_image: '',
  status: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

class LoadTestService {
  private savedResults: ServiceLoadTestResults[] = [];
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;

  constructor() {
    // Try to load any saved results from localStorage
    try {
      const savedResultsJson = localStorage.getItem('loadTestResults');
      if (savedResultsJson) {
        this.savedResults = JSON.parse(savedResultsJson);
      }
    } catch (err) {
      console.error('Failed to load saved load test results', err);
    }
  }

  // Save results to localStorage
  private saveResults(): void {
    try {
      localStorage.setItem('loadTestResults', JSON.stringify(this.savedResults));
    } catch (err) {
      console.error('Failed to save load test results', err);
    }
  }

  // Helper method to time a function execution
  private async timeExecution<T>(
    func: () => Promise<T>,
    functionName: string
  ): Promise<LoadTestResult<T>> {
    try {
      const start = performance.now();
      const result = await func();
      const end = performance.now();
      const executionTime = end - start;

      return {
        functionName,
        executionTime,
        success: true,
        data: result, // Store the result data for later use if needed
      };
    } catch (error) {
      return {
        functionName,
        executionTime: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // Calculate aggregate metrics for test results
  private calculateAggregateMetrics(
    results: LoadTestResult[]
  ): { averageTime: number; totalTime: number } {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return {
        averageTime: 0,
        totalTime: 0,
      };
    }
    
    const totalTime = successfulResults.reduce((sum, result) => sum + result.executionTime, 0);
    const averageTime = totalTime / successfulResults.length;
    
    return {
      averageTime,
      totalTime,
    };
  }

  // Get stored test results
  public getStoredResults(): ServiceLoadTestResults[] {
    return this.savedResults;
  }

  // Clear stored test results
  public clearStoredResults(): void {
    this.savedResults = [];
    this.saveResults();
  }

  // Update performance thresholds
  public setThresholds(thresholds: PerformanceThresholds): void {
    this.thresholds = {
      ...DEFAULT_THRESHOLDS,
      ...thresholds,
    };
  }

  // Get current performance thresholds
  public getThresholds(): PerformanceThresholds {
    return this.thresholds;
  }

  // Get the performance rating based on execution time
  public getPerformanceRating(executionTime: number): 'excellent' | 'good' | 'low' {
    if (executionTime <= this.thresholds.excellent) return 'excellent';
    if (executionTime <= this.thresholds.good) return 'good';
    return 'low';
  }

  // Test Google Sheets API
  public async testGoogleSheetsAPI(): Promise<ServiceLoadTestResults> {
    const results: LoadTestResult[] = [];

    // Test getAllRecords
    results.push(
      await this.timeExecution(
        () => googleSheetsAPI.getAllRecords(),
        'getAllRecords'
      )
    );

    // Test createRecord
    const createRecordTest = await this.timeExecution(
      () => googleSheetsAPI.createRecord(mockRecordData),
      'createRecord'
    );
    results.push(createRecordTest);
    
    // Only continue if create was successful
    if (createRecordTest.success) {
      // Assuming the createRecord returns the created record with an id
      const createdRecordId = createRecordTest.data?.id || 1;

      // Test getRecordById
      results.push(
        await this.timeExecution(
          () => googleSheetsAPI.getRecordById(createdRecordId),
          'getRecordById'
        )
      );

      // Test searchRecords
      results.push(
        await this.timeExecution(
          () => googleSheetsAPI.searchRecords('name', 'Load Test'),
          'searchRecords'
        )
      );

      // Test updateRecord
      results.push(
        await this.timeExecution(
          () => googleSheetsAPI.updateRecord(createdRecordId, { ...mockRecordData, name: 'Updated Load Test User' }),
          'updateRecord'
        )
      );

      // Test deleteRecord
      results.push(
        await this.timeExecution(
          () => googleSheetsAPI.deleteRecord(createdRecordId),
          'deleteRecord'
        )
      );
    }

    const { averageTime, totalTime } = this.calculateAggregateMetrics(results);
    
    const serviceResults: ServiceLoadTestResults = {
      serviceName: 'Google Sheets API',
      results,
      averageTime,
      totalTime,
      timestamp: new Date().toISOString(),
    };

    // Save the results
    this.savedResults.push(serviceResults);
    this.saveResults();

    return serviceResults;
  }

  // Test Appwrite Service
  public async testAppwriteService(): Promise<ServiceLoadTestResults> {
    const results: LoadTestResult[] = [];

    // Test getAllRecords
    results.push(
      await this.timeExecution(
        () => appwriteService.getAllRecords(),
        'getAllRecords'
      )
    );

    // Test createRecord
    const createRowTest = await this.timeExecution(
      () => appwriteService.createRecord(mockRecordData),
      'createRecord'
    );
    results.push(createRowTest);
    
    // Only continue if create was successful
    if (createRowTest.success) {
      const createdRowId = createRowTest.data?.$id || '';

      // Test getRecordById
      results.push(
        await this.timeExecution(
          () => appwriteService.getRecordById(createdRowId),
          'getRecordById'
        )
      );

      // Test searchRecords
      results.push(
        await this.timeExecution(
          () => appwriteService.searchRecords('name', 'Load Test'),
          'searchRecords'
        )
      );

      // Test updateRecord with proper type
      results.push(
        await this.timeExecution(
          () => appwriteService.updateRecord(createdRowId, {
            name: 'Updated Load Test User',
            email: mockRecordData.email,
            phone: mockRecordData.phone,
            department: mockRecordData.department,
            position: mockRecordData.position,
            profile_image: mockRecordData.profile_image,
            status: mockRecordData.status,
            created_at: mockRecordData.created_at,
            updated_at: mockRecordData.updated_at
          } as RecordAppwrite),
          'updateRecord'
        )
      );

      // Test deleteRecord
      results.push(
        await this.timeExecution(
          () => appwriteService.deleteRecord(createdRowId),
          'deleteRecord'
        )
      );
    }
    
    // Test image operations if needed
    // results.push(
    //   await this.timeExecution(
    //     () => appwriteService.getAllImages(),
    //     'getAllImages'
    //   )
    // );

    const { averageTime, totalTime } = this.calculateAggregateMetrics(results);
    
    const serviceResults: ServiceLoadTestResults = {
      serviceName: 'Appwrite Service',
      results,
      averageTime,
      totalTime,
      timestamp: new Date().toISOString(),
    };

    // Save the results
    this.savedResults.push(serviceResults);
    this.saveResults();

    return serviceResults;
  }

  // Test Firebase Service
  public async testFirebaseService(): Promise<ServiceLoadTestResults> {
    const results: LoadTestResult[] = [];

    // Test getAllRecords
    results.push(
      await this.timeExecution(
        () => firebaseService.getAllRecords(),
        'getAllRecords'
      )
    );

    // Test createRecord
    const createRecordTest = await this.timeExecution(
      () => firebaseService.createRecord(mockRecordData),
      'createRecord'
    );
    results.push(createRecordTest);
    
    // Only continue if create was successful
    if (createRecordTest.success) {
      const createdRecordId = createRecordTest.data?.id || 1;

      // Test getRecordById
      results.push(
        await this.timeExecution(
          () => firebaseService.getRecordById(createdRecordId),
          'getRecordById'
        )
      );

      // Test searchRecords
      results.push(
        await this.timeExecution(
          () => firebaseService.searchRecords('name', 'Load Test'),
          'searchRecords'
        )
      );

      // Test updateRecord
      results.push(
        await this.timeExecution(
          () => firebaseService.updateRecord(createdRecordId, { name: 'Updated Load Test User' }),
          'updateRecord'
        )
      );

      // Test deleteRecord
      results.push(
        await this.timeExecution(
          () => firebaseService.deleteRecord(createdRecordId),
          'deleteRecord'
        )
      );
    }

    const { averageTime, totalTime } = this.calculateAggregateMetrics(results);
    
    const serviceResults: ServiceLoadTestResults = {
      serviceName: 'Firebase Service',
      results,
      averageTime,
      totalTime,
      timestamp: new Date().toISOString(),
    };

    // Save the results
    this.savedResults.push(serviceResults);
    this.saveResults();

    return serviceResults;
  }

  // Test NEON API
  public async testNeonAPI(): Promise<ServiceLoadTestResults> {
    const results: LoadTestResult[] = [];

    // Test getAllRecords
    results.push(
      await this.timeExecution(
        () => neonAPI.getAllRecords(),
        'getAllRecords'
      )
    );

    // Test createRecord
    const createEmployeeTest = await this.timeExecution(
      () => neonAPI.createRecord(mockRecordData),
      'createRecord'
    );
    results.push(createEmployeeTest);
    
    // Only continue if create was successful
    if (createEmployeeTest.success) {
      const id = await neonAPI.getLastId();
      const createdEmployeeId = id || 1;

      // Test getRecordById
      results.push(
        await this.timeExecution(
          () => neonAPI.getRecordById(createdEmployeeId.toString()),
          'getRecordById'
        )
      );

      // Test searchRecords
      results.push(
        await this.timeExecution(
          () => neonAPI.searchRecords('name', 'Load Test'),
          'searchRecords'
        )
      );

      // Test updateRecord
      results.push(
        await this.timeExecution(
          () => neonAPI.updateRecord(createdEmployeeId, { ...mockRecordData, name: 'Updated Load Test User' }),
          'updateRecord'
        )
      );

      // Test deleteRecord
      results.push(
        await this.timeExecution(
          () => neonAPI.deleteRecord(createdEmployeeId),
          'deleteRecord'
        )
      );
    }

    // Test health check
    // results.push(
    //   await this.timeExecution(
    //     () => neonAPI.healthCheck(),
    //     'healthCheck'
    //   )
    // );

    const { averageTime, totalTime } = this.calculateAggregateMetrics(results);
    
    const serviceResults: ServiceLoadTestResults = {
      serviceName: 'NEON API',
      results,
      averageTime,
      totalTime,
      timestamp: new Date().toISOString(),
    };

    // Save the results
    this.savedResults.push(serviceResults);
    this.saveResults();

    return serviceResults;
  }

  // Test all services
  public async testAllServices(): Promise<ServiceLoadTestResults[]> {
    const results: ServiceLoadTestResults[] = [];
    
    try {
      results.push(await this.testGoogleSheetsAPI());
    } catch (error) {
      console.error('Error testing Google Sheets API:', error);
    }
    
    try {
      results.push(await this.testAppwriteService());
    } catch (error) {
      console.error('Error testing Appwrite Service:', error);
    }
    
    try {
      results.push(await this.testFirebaseService());
    } catch (error) {
      console.error('Error testing Firebase Service:', error);
    }
    
    try {
      results.push(await this.testNeonAPI());
    } catch (error) {
      console.error('Error testing NEON API:', error);
    }
    
    return results;
  }

  // Test a specific service by API type
  public async testServiceByType(apiType: ApiType): Promise<ServiceLoadTestResults> {
    switch (apiType) {
      case ApiType.GOOGLE_SHEETS:
        return this.testGoogleSheetsAPI();
      case ApiType.APPWRITE:
        return this.testAppwriteService();
      case ApiType.FIREBASE:
        return this.testFirebaseService();
      case ApiType.NEON:
        return this.testNeonAPI();
      default:
        throw new Error('Unknown API type');
    }
  }
}

// Export a singleton instance of the service
export const loadTestService = new LoadTestService();
