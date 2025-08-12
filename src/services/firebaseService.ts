import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  query, 
  orderByChild, 
  equalTo,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import { db } from '../config/firebase.config';
import { Record } from '../models/record.model';
import { DEFAULT_QUERY_TYPE, TABLE_NAME } from '../constants/default.constant';
import { QUERY_TYPE } from '../enums/query-type.enum';

// Collection name in Firebase Realtime Database
const RECORDS_COLLECTION = TABLE_NAME;

/**
 * Firebase Database CRUD Service for Records
 */
export class FirebaseService {
  private recordsRef: DatabaseReference;

  constructor() {
    this.recordsRef = ref(db, RECORDS_COLLECTION);
  }

  /**
   * Initialize database structure if not exists
   * Creates the necessary structure for storing records
   */
  async initDatabaseStructure(): Promise<void> {
    const snapshot = await get(this.recordsRef);
    if (!snapshot.exists()) {
      // Create empty structure if doesn't exist
      await set(this.recordsRef, {});
    }
  }

  /**
   * Get the next available ID for a new record
   * @returns Promise with the next ID to use
   */
  private async getNextId(): Promise<number> {
    const records = await this.getAllRecords();
    if (records.length === 0) {
      return 1; // Start with 1 if no records exist
    }
    
    // Find max ID and increment
    const maxId = Math.max(...records.map(r => r.id));
    return maxId + 1;
  }

  /**
   * Create a new record in Firebase Database
   * @param record Record data without ID
   * @returns Promise with the created record including ID
   */
  async createRecord(record: Omit<Record, 'id'>): Promise<Record> {
    // Ensure database structure exists
    await this.initDatabaseStructure();
    
    // Get next numeric ID
    const nextId = await this.getNextId();
    
    // Create new record with the generated ID
    const newRecord: Record = {
      id: nextId,
      ...record,
      status: 1,
    };
    
    // Save to Firebase using the numeric ID as the key
    const recordRef = ref(db, `${RECORDS_COLLECTION}/${nextId}`);
    await set(recordRef, newRecord);
    
    return newRecord;
  }

  /**
   * Get a record by ID
   * @param id Record ID
   * @returns Promise with the record or null if not found
   */
  async getRecordById(id: number): Promise<Record | null> {
    const recordRef = ref(db, `${RECORDS_COLLECTION}/${id}`);
    const snapshot = await get(recordRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Record;
    }
    
    return null;
  }

  /**
   * Get all records
   * @returns Promise with an array of all records
   */
  async getAllRecords(): Promise<Record[]> {
    const snapshot = await get(this.recordsRef);
    const records: Record[] = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot: DataSnapshot) => {
        const record = childSnapshot.val();
        if (record && typeof record === 'object' && 'id' in record) {
          records.push(record as Record);
        }
      });
    }
    
    return records;
  }

  /**
   * Find records by a specific field
   * @param field Field name to search
   * @param value Value to match
   * @param matchType Match type - 'exact' for exact match or 'contains' for substring search
   * @returns Promise with matching records array
   */
  async searchRecords(field: keyof Record, value: string, matchType = DEFAULT_QUERY_TYPE): Promise<Record[]> {
    if (matchType === QUERY_TYPE.EXACT) {
      // For exact matching, use Firebase's equalTo operator
      const recordsQuery = query(
        this.recordsRef,
        orderByChild(field),
        equalTo(value)
      );
      
      const snapshot = await get(recordsQuery);
      const records: Record[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          records.push(childSnapshot.val() as Record);
        });
      }
      
      return records;
    } else {
      // For substring/contains matching, we need to retrieve a broader set and filter client-side
      // First, get all records (or optimize by getting records that might contain the substring)
      const snapshot = await get(this.recordsRef);
      const records: Record[] = [];
      
      if (snapshot.exists()) {
        const lowerCaseValue = value.toLowerCase();
        
        snapshot.forEach((childSnapshot: DataSnapshot) => {
          const record = childSnapshot.val() as Record;
          const fieldValue = String(record[field] || '').toLowerCase();
          
          if (fieldValue.includes(lowerCaseValue)) {
            records.push(record);
          }
        });
      }
      
      return records;
    }
  }

  /**
   * Update an existing record
   * @param id Record ID
   * @param updates Partial record data to update
   * @returns Promise with the updated record
   */
  async updateRecord(id: number, updates: Partial<Omit<Record, 'id'>>): Promise<Record> {
    const recordRef = ref(db, `${RECORDS_COLLECTION}/${id}`);
    
    // Verify record exists first
    const snapshot = await get(recordRef);
    if (!snapshot.exists()) {
      throw new Error(`Record with ID ${id} not found`);
    }
    
    // Update the record
    await update(recordRef, updates);
    
    // Get the updated record
    const updatedSnapshot = await get(recordRef);
    return updatedSnapshot.val() as Record;
  }

  /**
   * Delete a record by ID
   * @param id Record ID
   * @returns Promise<boolean> true if deletion was successful
   */
  async deleteRecord(id: number): Promise<boolean> {
    const recordRef = ref(db, `${RECORDS_COLLECTION}/${id}`);
    
    // Verify record exists first
    const snapshot = await get(recordRef);
    if (!snapshot.exists()) {
      throw new Error(`Record with ID ${id} not found`);
    }
    
    await remove(recordRef);
    return true;
  }
}

// Export a singleton instance of the service
export const firebaseService = new FirebaseService();
