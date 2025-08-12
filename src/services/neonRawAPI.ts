// NEON Raw Database API Service
// This service handles all CRUD operations with NEON Database

import { Record } from '../models/record.model';
import { TABLE_NAME } from '../constants/default.constant';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

class NeonRawAPIService {
  private db: NeonQueryFunction<any, any> | null = null;

  constructor() {
    if (process.env.REACT_APP_DB_URL) {
      this.db = neon(process.env.REACT_APP_DB_URL);
    } else {
      console.warn('Database connection is not initialized');
    }
  }

  /**
   * Create the table if it doesn't exist
   */
  createDbTable = async () => {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }

    const tableName = `CREATE TABLE IF NOT EXISTS "${TABLE_NAME}" (
        "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "${TABLE_NAME}_id_seq"),
        "name" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "department" TEXT,
        "position" TEXT,
        "profile_image" TEXT,
        "status" integer DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )`;
    // Use the query method instead of sql template literal for DDL statements with identifiers
    return await this.db(tableName);
  };

  /**
   * Get the last inserted ID from the table
   */
  getLastId = async (): Promise<number> => {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }

    try {
      const query = `SELECT id FROM "${TABLE_NAME}" ORDER BY id DESC LIMIT 1`;
      const result = await this.db(query) as Record[];
      return Number(result[0].id);
    } catch (error) {
      console.error('Error fetching last ID:', error);
      throw new Error('Failed to fetch last ID');
    }
  }

  /**
   * Get all records from the table
   */
  async getAllRecords(): Promise<Record[]> {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }

    try {
      const query = `SELECT * FROM "${TABLE_NAME}"`;
      const result = await this.db(query) as Record[];
      return result;
    } catch (error) {
      console.error('Error fetching records:', error);
      throw new Error('Failed to fetch records');
    }
  }

  /**
   * Get a record by ID from the table
   */
  async getRecordById(id: number): Promise<Record | null> {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }

    try {
      const query = `SELECT * FROM "${TABLE_NAME}" WHERE id = $1`;
      const result = await this.db(query, [id]) as Record[];
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      throw new Error('Failed to fetch record by ID');
    }
  }

  /**
   * Search records by a specific key and value
   */
  async searchRecords(key: keyof Record, value: string): Promise<Record[]> {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }

    try {
      const query = `SELECT * FROM "${TABLE_NAME}" WHERE ${key} = $1`;
      const result = await this.db(query, [value]) as Record[];
      return result;
    } catch (error) {
      console.error('Error searching records:', error);
      throw new Error('Failed to search records');
    }
  }

  /**
   * Create a new record in the table
   */
  async createRecord(recordData: Omit<Record, 'id'>): Promise<Record> {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }

    try {
      const query = `INSERT INTO "${TABLE_NAME}" (name, email, phone, department, position, profile_image, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
      await this.db(query, [
        recordData.name,
        recordData.email,
        recordData.phone,
        recordData.department,
        recordData.position,
        recordData.profile_image,
        recordData.status,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      return {
        id: 0,
        ...recordData
      };
    } catch (error) {
      console.error('Error creating record:', error);
      throw new Error('Failed to create record');
    }
  }

  /**
   * Update an existing record in the table
   */
  async updateRecord(id: number, recordData: Omit<Record, 'id'>): Promise<Record> {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }

    try {
      const query = `UPDATE "${TABLE_NAME}" SET name = $1, email = $2, phone = $3, department = $4, position = $5, profile_image = $6, status = $7, updated_at = $8 WHERE id = $9`;
      await this.db(query, [
        recordData.name,
        recordData.email,
        recordData.phone,
        recordData.department,
        recordData.position,
        recordData.profile_image,
        recordData.status,
        new Date().toISOString(),
        id
      ]);
      return {
        id,
        ...recordData
      };
    } catch (error) {
      console.error('Error updating record:', error);
      throw new Error('Failed to update record');
    }
  }

  /**
   * Delete a record from the table
   */
  async deleteRecord(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection is not initialized');
    }

    try {
      const query = `DELETE FROM "${TABLE_NAME}" WHERE id = $1`;
      await this.db(query, [id]);
    } catch (error) {
      console.error('Error deleting record:', error);
      throw new Error('Failed to delete record');
    }
  }
}

// Export a singleton instance
export const neonRawAPI = new NeonRawAPIService();
