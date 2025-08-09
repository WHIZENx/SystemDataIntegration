// NEON Database API Service
// This service handles all CRUD operations with NEON Database

import axios, { AxiosResponse } from 'axios';
import { Record } from '../App';
import { createPool, VercelPool } from '@vercel/postgres';


interface NeonAuthResponse {
  access_token: string;
  expires_at_millis?: number;
  error?: string;
}

interface NeonAPIResponse {
  data?: any;
  error?: string;
  message?: string;
}

class NeonAPIService {
  private apiUrl: string;
  private authUrl: string;
  private stackProjectId: string;
  private publishableClientKey: string;
  private secretServerKey: string;
  private refreshToken: string;
  private authUserId: string;
  private currentAccessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private db: VercelPool | null = null;

  constructor() {
    // Load configuration from environment variables
    this.apiUrl = process.env.REACT_APP_NEON_API_URL || '';
    this.authUrl = process.env.REACT_APP_NEON_AUTH_URL || '';
    this.stackProjectId = process.env.REACT_APP_NEON_PUBLIC_STACK_PROJECT_ID || '';
    this.publishableClientKey = process.env.REACT_APP_NEON_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || '';
    this.secretServerKey = process.env.REACT_APP_NEON_SECRET_SERVER_KEY || '';
    this.refreshToken = process.env.REACT_APP_NEON_REFRESH_TOKEN || '';
    this.authUserId = process.env.REACT_APP_NEON_AUTH_USER_ID || '';

    if (process.env.REACT_APP_DB_URL) {
      this.db = createPool({
        connectionString: process.env.REACT_APP_DB_URL,
      });
    }

    if (!this.apiUrl || !this.authUrl) {
      console.warn('NEON API configuration is incomplete. Some features may not work.');
    }
  }
  
  /**
   * Create the 'employees' table if it doesn't exist
   */
  createDbEmployee = async () => {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }
    return await this.db.sql`CREATE TABLE IF NOT EXISTS "employees" ("id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employees_id_seq"),"name" TEXT,"email" TEXT,"phone" TEXT,"department" TEXT,"position" TEXT)`;
  };

  /**
   * Get a fresh access token from NEON Auth API
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    const now = Date.now();
    if (this.currentAccessToken && this.tokenExpiresAt > now + 5 * 60 * 1000) {
      return this.currentAccessToken;
    }

    try {
      const response: AxiosResponse<NeonAuthResponse> = await axios.post(
        this.authUrl,
        {
          description: "Deploy",
          expires_at_millis: 3600,
          is_public: 1,
          user_id: this.authUserId
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Stack-Access-Type': 'server',
            'X-Stack-Project-Id': this.stackProjectId,
            'X-Stack-Publishable-Client-Key': this.publishableClientKey,
            'X-Stack-Secret-Server-Key': this.secretServerKey,
            'x-stack-refresh-token': this.refreshToken,
          },
          timeout: 30000,
        }
      );

      const { access_token, expires_at_millis } = response.data;
      
      if (!access_token) {
        throw new Error('No access token received from auth API');
      }

      this.currentAccessToken = access_token;
      this.tokenExpiresAt = expires_at_millis ? Date.now() + expires_at_millis : Date.now() + 3600 * 1000;

      return access_token;
    } catch (error) {
      console.error('Failed to refresh NEON token:', error);
      throw new Error('Failed to authenticate with NEON API');
    }
  }

  /**
   * Make an authenticated request to NEON API
   */
  private async makeAuthenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `${this.apiUrl}${endpoint}`,
        data,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      console.error(`NEON API ${method} ${endpoint} failed:`, error);
      
      if (error.response?.status === 401) {
        // Token might be expired, clear it and retry once
        this.currentAccessToken = null;
        this.tokenExpiresAt = 0;
        
        const newAccessToken = await this.getAccessToken();
        const retryResponse: AxiosResponse<T> = await axios({
          method,
          url: `${this.apiUrl}${endpoint}`,
          data,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`,
          },
          timeout: 30000,
        });
        
        return retryResponse.data;
      }
      
      throw new Error(`NEON API request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * EMPLOYEE CRUD OPERATIONS
   * These methods work with the 'Employee' table using the Record interface
   */

  /**
   * CREATE - Add a new employee record
   */
  async createEmployee(employeeData: Omit<Record, 'id'>): Promise<Record> {
    try {
      const result = await this.makeAuthenticatedRequest<NeonAPIResponse>(
        'POST',
        '/employees',
        employeeData
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('Failed to create employee in NEON Database');
    }
  }

  /**
   * READ - Get all employee records
   */
  async getAllEmployees(): Promise<Record[]> {
    try {
      const result = await this.makeAuthenticatedRequest<Record[]>(
        'GET',
        '/employees'
      );

      return result || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('Failed to fetch employees from NEON Database');
    }
  }

  /**
   * READ - Get a specific employee by ID
   */
  async getEmployee(id: string): Promise<Record> {
    try {
      const result = await this.makeAuthenticatedRequest<Record>(
        'GET',
        `/employees/${id}`
      );

      if (!result) {
        throw new Error('Employee not found');
      }

      return result;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw new Error('Failed to fetch employee from NEON Database');
    }
  }

  /**
   * UPDATE - Update an existing employee record
   */
  async updateEmployee(id: string, employeeData: Omit<Record, 'id'>): Promise<Record> {
    try {
      const result = await this.makeAuthenticatedRequest<NeonAPIResponse>(
        'PATCH',
        `/employees?id=eq.${id}`,
        employeeData
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return { id, ...employeeData, ...result.data };
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('Failed to update employee in NEON Database');
    }
  }

  /**
   * DELETE - Remove an employee record
   */
  async deleteEmployee(id: string): Promise<Record> {
    try {
      const result = await this.makeAuthenticatedRequest<NeonAPIResponse>(
        'DELETE',
        `/employees?id=eq.${id}`
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw new Error('Failed to delete employee from NEON Database');
    }
  }

  /**
   * SEARCH - Search employees by criteria
   */
  async searchEmployees(criteria: {
    name?: string;
    email?: string;
    department?: string;
    position?: string;
  }): Promise<Record[]> {
    try {
      // const queryParams = new URLSearchParams();
      // Object.entries(criteria).forEach(([key, value]) => {
      //   if (value) {
      //     queryParams.append(key, value);
      //   }
      // });

      const endpoint = `/employees?name=like.%${criteria.name}%`;
      
      const result = await this.makeAuthenticatedRequest<Record[]>(
        'GET',
        endpoint
      );

      return result || [];
    } catch (error) {
      console.error('Error searching employees:', error);
      throw new Error('Failed to search employees in NEON Database');
    }
  }

  /**
   * Health check - Test connection to NEON API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('NEON API health check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const NeonAPI = new NeonAPIService();
