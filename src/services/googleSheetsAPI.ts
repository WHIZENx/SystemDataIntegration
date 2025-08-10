// Google Sheets API Service
// This service handles all CRUD operations with Google Apps Script

import axios, { AxiosResponse, CancelToken } from 'axios';
import { Record } from '../models/record.model';
import { APIResponse } from '../models/google-sheet.model';

class GoogleSheetsAPIService {
  private baseURL: string;
  private useMockData: boolean;
  private mockData: Record[];

  constructor() {
    // Replace this URL with your Google Apps Script Web App URL
    // You'll get this URL after deploying your Google Apps Script
    this.baseURL = process.env.REACT_APP_GOOGLE_SCRIPT_URL || 
                   `https://script.google.com/macros/s/${process.env.REACT_APP_GOOGLE_SCRIPT_ID}/exec`;
    
    // For development/testing, we'll use mock data
    this.useMockData = !process.env.REACT_APP_GOOGLE_SCRIPT_URL && !process.env.REACT_APP_GOOGLE_SCRIPT_ID;
    
    // Mock data for development
    this.mockData = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@company.com',
        phone: '+1-555-0123',
        department: 'Engineering',
        position: 'Senior Developer'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        phone: '+1-555-0124',
        department: 'Marketing',
        position: 'Marketing Manager'
      },
      {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        phone: '+1-555-0125',
        department: 'Sales',
        position: 'Sales Representative'
      },
      {
        id: 4,
        name: 'Sarah Wilson',
        email: 'sarah.wilson@company.com',
        phone: '+1-555-0126',
        department: 'HR',
        position: 'HR Specialist'
      },
      {
        id: 5,
        name: 'David Brown',
        email: 'david.brown@company.com',
        phone: '+1-555-0127',
        department: 'Finance',
        position: 'Financial Analyst'
      }
    ];
  }

  // Simulate network delay for realistic testing
  private delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate a unique ID for new records
  private generateId(): number {
    return Date.now() + Math.random();
  }

  async initSheet() {
    try {
      await axios.post(
        this.baseURL,
        {
          action: 'init',
        },
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 60000, // Longer timeout for batch operations
        }
      );
    } catch (error) {
      console.error('Error fetching records:', error);
      throw new Error('Failed to fetch records from Google Sheets');
    }
  }

  // GET all records
  async getAllRecords(cancelToken?: CancelToken): Promise<Record[]> {
    if (this.useMockData) {
      await this.delay(800);
      return [...this.mockData];
    }

    try {
      const response: AxiosResponse<APIResponse> = await axios.get(
        `${this.baseURL}?action=getAll`,
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 30000,
          cancelToken: cancelToken, // Use axios cancelToken
        }
      );

      return response.data.records || [];
    } catch (error: any) {
      // Check if the request was cancelled
      if (axios.isCancel(error)) {
        console.log('Request was cancelled:', error.message);
        throw error; // Re-throw the cancellation error
      }
      console.error('Error fetching records:', error);
      throw new Error('Failed to fetch records from Google Sheets');
    }
  }

  // CREATE multiple records (batch)
  async createMultipleRecords(recordsData: Omit<Record, 'id'>[]): Promise<Record[]> {
    if (this.useMockData) {
      await this.delay(1500);
      const newRecords: Record[] = recordsData.map(recordData => ({
        id: this.generateId(),
        ...recordData
      }));
      this.mockData.push(...newRecords);
      return newRecords;
    }

    try {
      const response: AxiosResponse<APIResponse> = await axios.post(
        this.baseURL,
        {
          action: 'createMultiple',
          data: recordsData
        },
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 60000, // Longer timeout for batch operations
        }
      );

      const result = response.data;
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.records) {
        throw new Error('No records returned from API');
      }

      return result.records;
    } catch (error) {
      console.error('Error creating multiple records:', error);
      throw new Error('Failed to create multiple records in Google Sheets');
    }
  }

  // CREATE a new record
  async createRecord(recordData: Omit<Record, 'id'>): Promise<Record> {
    if (this.useMockData) {
      await this.delay(1000);
      const newRecord: Record = {
        id: this.generateId(),
        ...recordData
      };
      this.mockData.push(newRecord);
      return newRecord;
    }

    try {
      const response: AxiosResponse<APIResponse> = await axios.post(
        this.baseURL,
        {
          action: 'create',
          data: recordData
        },
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 30000,
        }
      );

      const result = response.data;
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.record) {
        throw new Error('No record returned from API');
      }

      return result.record;
    } catch (error) {
      console.error('Error creating record:', error);
      throw new Error('Failed to create record in Google Sheets');
    }
  }

  // MODIFY multiple records (batch)
  async modifyMultipleRecords(recordsData: Omit<Record, 'id'>[]): Promise<Record[]> {
    if (this.useMockData) {
      await this.delay(1500);
      const newRecords: Record[] = recordsData.map(recordData => ({
        id: this.generateId(),
        ...recordData
      }));
      this.mockData.push(...newRecords);
      return newRecords;
    }

    try {
      const response: AxiosResponse<APIResponse> = await axios.post(
        this.baseURL,
        {
          action: 'modify',
          data: recordsData
        },
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 60000, // Longer timeout for batch operations
        }
      );

      const result = response.data;
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.records) {
        throw new Error('No records returned from API');
      }

      return result.records;
    } catch (error) {
      console.error('Error modifying multiple records:', error);
      throw new Error('Failed to modify multiple records in Google Sheets');
    }
  }

  // UPDATE an existing record
  async updateRecord(id: number, recordData: Omit<Record, 'id'>): Promise<Record> {
    if (this.useMockData) {
      await this.delay(1000);
      const index = this.mockData.findIndex(record => record.id === id);
      if (index === -1) {
        throw new Error('Record not found');
      }
      
      this.mockData[index] = {
        ...this.mockData[index],
        ...recordData
      };
      return this.mockData[index];
    }

    try {
      const response: AxiosResponse<APIResponse> = await axios.post(
        this.baseURL,
        {
          action: 'update',
          id: id,
          data: recordData
        },
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 30000,
        }
      );

      const result = response.data;
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.record) {
        throw new Error('No record returned from API');
      }

      return result.record;
    } catch (error) {
      console.error('Error updating record:', error);
      throw new Error('Failed to update record in Google Sheets');
    }
  }

  // DELETE a record
  async deleteRecord(id: number): Promise<Record> {
    if (this.useMockData) {
      await this.delay(800);
      const index = this.mockData.findIndex(record => record.id === id);
      if (index === -1) {
        throw new Error('Record not found');
      }
      
      const deletedRecord = this.mockData.splice(index, 1)[0];
      return deletedRecord;
    }

    try {
      const response: AxiosResponse<APIResponse> = await axios.post(
        this.baseURL,
        {
          action: 'delete',
          id: id
        },
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 30000,
        }
      );

      const result = response.data;
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.record) {
        throw new Error('No record returned from API');
      }

      return result.record;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw new Error('Failed to delete record from Google Sheets');
    }
  }

  // GET a single record by ID
  async getRecord(id: number): Promise<Record> {
    if (this.useMockData) {
      await this.delay(500);
      const record = this.mockData.find(record => record.id === id);
      if (!record) {
        throw new Error('Record not found');
      }
      return record;
    }

    try {
      const response: AxiosResponse<APIResponse> = await axios.get(
        `${this.baseURL}?action=get&id=${id}`,
        {
          headers: {
            'Content-Type': 'text/plain',
          },
          timeout: 30000,
        }
      );

      const result = response.data;
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.record) {
        throw new Error('No record returned from API');
      }

      return result.record;
    } catch (error) {
      console.error('Error fetching record:', error);
      throw new Error('Failed to fetch record from Google Sheets');
    }
  }
}

// Export a singleton instance
export const GoogleSheetsAPI = new GoogleSheetsAPIService();
