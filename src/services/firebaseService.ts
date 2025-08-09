import { 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  push, 
  query, 
  orderByChild, 
  equalTo,
  DatabaseReference,
  DataSnapshot 
} from 'firebase/database';
import { db } from '../config/firebase.config';
import { Record } from '../models/record.model';
import { TABLE_NAME } from '../constants/default.constant';

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
   * Create a new record in Firebase Database
   * @param record Record data without ID
   * @returns Promise with the created record including ID
   */
  async createRecord(record: Omit<Record, 'id'>): Promise<Record> {
    // Generate a new reference with unique ID
    const newRecordRef = push(this.recordsRef);
    const recordId = Number(newRecordRef.key);
    
    // Create new record with the generated ID
    const newRecord: Record = {
      id: recordId,
      ...record
    };
    
    // Save to Firebase
    await set(newRecordRef, newRecord);
    
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
        records.push(childSnapshot.val() as Record);
      });
    }
    
    return records;
  }

  /**
   * Find records by a specific field
   * @param field Field name to search
   * @param value Value to match
   * @returns Promise with matching records array
   */
  async findRecordsByField(field: keyof Record, value: string): Promise<Record[]> {
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
