import { storage, ID, database } from '../config/appwrite.config';
import { v4 as uuidv4 } from 'uuid';
import { RecordAppwrite, StorageImage } from '../models/app-write.model';
import { Record } from '../models/record.model';
import { Query } from 'appwrite';

/**
 * Appwrite Storage Service for image operations
 */
export class AppwriteService {
  private bucketId: string;
  private databaseId: string;
  private collectionId: string;

  /**
   * Constructor for AppwriteService
   * @param bucketId The ID of the Appwrite storage bucket (default: from APPWRITE_BUCKET_ID)
   * @param databaseId The ID of the Appwrite database (default: from APPWRITE_DATABASE_ID)
   * @param collectionId The ID of the Appwrite collection (default: from APPWRITE_COLLECTION_ID)
   */
  constructor(bucketId: string = process.env.REACT_APP_APPWRITE_BUCKET_ID || '', databaseId: string = process.env.REACT_APP_APPWRITE_DATABASE_ID || '', collectionId: string = process.env.REACT_APP_APPWRITE_COLLECTION_ID || '') {
    this.bucketId = bucketId;
    this.databaseId = databaseId;
    this.collectionId = collectionId;
  }

  /**
   * Upload a file to Appwrite Storage
   * @param file File to upload
   * @param customFileName Optional custom file name (default: generates UUID)
   * @returns Promise with the storage image metadata
   */
  async uploadImage(file: File, customFileName?: string): Promise<StorageImage> {
    const fileName = customFileName || `${uuidv4()}-${file.name}`;
    
    try {
      const result = await storage.createFile(
        this.bucketId,
        ID.unique(),
        file
      );

      // Get file URL
      const fileUrl = await this.getImageUrl(result.$id);
      
      return {
        id: result.$id,
        name: fileName,
        url: fileUrl,
        fullPath: `${this.bucketId}/${result.$id}`,
        contentType: file.type,
        size: file.size,
        timeCreated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error}`);
    }
  }

  /**
   * Get all images from the storage bucket
   * @returns Promise with array of storage images
   */
  async getAllImages(): Promise<StorageImage[]> {
    try {
      const result = await storage.listFiles(this.bucketId);
      
      const imagesPromises = result.files.map(async (file) => {
        const url = await this.getImageUrl(file.$id);
        
        return {
          id: file.$id,
          name: file.name || file.$id,
          url: url,
          fullPath: `${this.bucketId}/${file.$id}`,
          contentType: file.mimeType,
          size: file.sizeOriginal,
          timeCreated: file.$createdAt
        };
      });
      
      return await Promise.all(imagesPromises);
    } catch (error) {
      console.error('Error getting images:', error);
      throw new Error(`Failed to get images: ${error}`);
    }
  }

  /**
   * Delete an image from Appwrite Storage
   * @param fileId ID of the file to delete
   * @returns Promise<boolean> true if deletion was successful
   */
  async deleteImage(fileId: string): Promise<boolean> {
    try {
      await storage.deleteFile(this.bucketId, fileId);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error}`);
    }
  }

  /**
   * Get a direct download URL for an image
   * @param fileId ID of the file
   * @returns Promise with the download URL
   */
  async getImageUrl(fileId: string): Promise<string> {
    try {
      // Appwrite's getFileView returns the URL directly as a string
      return storage.getFileView(this.bucketId, fileId).toString();
    } catch (error) {
      console.error('Error getting image URL:', error);
      throw new Error(`Failed to get image URL: ${error}`);
    }
  }

  /**
   * Download an image from Appwrite Storage
   * @param fileId ID of the file to download
   * @returns Promise with the download URL that triggers browser download
   */
  async downloadImage(fileId: string): Promise<string> {
    try {
      // Use Appwrite's getFileDownload to get a URL that forces download
      const downloadUrl = storage.getFileDownload(this.bucketId, fileId).toString();
      
      return downloadUrl;
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error(`Failed to download image: ${error}`);
    }
  }

  /**
   * View an image from Appwrite Storage
   * @param fileId ID of the file to view
   * @returns Promise with the view URL
   */
  async viewImage(fileId: string): Promise<string> {
    try {
      // Use Appwrite's getFileView to get a URL that forces download
      const viewUrl = storage.getFileView(this.bucketId, fileId).toString();
      
      return viewUrl;
    } catch (error) {
      console.error('Error viewing image:', error);
      throw new Error(`Failed to view image: ${error}`);
    }
  }

  /**
   * Preview an image from Appwrite Storage *(No plan for free)*
   * @param fileId ID of the file to preview
   * @returns Promise with the preview URL
   */
  async previewImage(fileId: string): Promise<string> {
    try {
      // Use Appwrite's getFilePreview to get a URL that forces download
      const previewUrl = storage.getFilePreview(this.bucketId, fileId).toString();
      
      return previewUrl;
    } catch (error) {
      console.error('Error previewing image:', error);
      throw new Error(`Failed to preview image: ${error}`);
    }
  }

  /**
   * Get all rows from Appwrite Database
   * @returns Promise with the list of rows
   */
  async getAllRecords() {
    try {
      const result = await database.listDocuments(this.databaseId, this.collectionId);
      return result.documents as unknown as RecordAppwrite[];
    } catch (error) {
      console.error('Error getting all rows:', error);
      throw new Error(`Failed to get all rows: ${error}`);
    }
  }

  /**
   * Search rows in Appwrite Database
   * @returns Promise with the list of rows
   */
  async searchRecords(field: keyof RecordAppwrite, query: string) {
    try {
      const result = await database.listDocuments(this.databaseId, this.collectionId, [
        Query.contains(field, query),
      ]);
      return result.documents as unknown as RecordAppwrite[];
    } catch (error) {
      console.error('Error searching rows:', error);
      throw new Error(`Failed to search rows: ${error}`);
    }
  }

  /**
   * Get a row by ID from Appwrite Database
   * @param id ID of the row to get
   * @returns Promise with the row data
   */
  async getRecordById(id: string) {
    try {
      const result = await database.getDocument(this.databaseId, this.collectionId, id);
      return result as unknown as RecordAppwrite;
    } catch (error) {
      console.error('Error getting row by id:', error);
      throw new Error(`Failed to get row by id: ${error}`);
    }
  }

  /**
   * Create a new row in Appwrite Database
   * @param data Data to create the row with
   * @returns Promise with the created row data
   */
  async createRecord(data: Omit<Record, 'id'>) {
    try {
      const rows = await this.getAllRecords();
      const nextId = rows[rows.length - 1]?.id + 1 || 1;
      const result = await database.createDocument(this.databaseId, this.collectionId, ID.unique(), { ...data, id: nextId, status: 1 });
      return result as unknown as RecordAppwrite;
    } catch (error) {
      console.error('Error creating row:', error);
      throw new Error(`Failed to create row: ${error}`);
    }
  }

  /**
   * Update a row in Appwrite Database
   * @param id ID of the row to update
   * @param data Data to update the row with
   * @returns Promise with the updated row data
   */
  async updateRecord(id: string | number, data: Omit<RecordAppwrite, 'id' | '$id' | '$sequence' | '$createdAt' | '$updatedAt' | '$permissions' | '$collectionId' | '$databaseId'>) {
    try {
      const result = await database.updateDocument(this.databaseId, this.collectionId, id.toString(), data);
      return result as unknown as RecordAppwrite;
    } catch (error) {
      console.error('Error updating row:', error);
      throw new Error(`Failed to update row: ${error}`);
    }
  }

  /**
   * Delete a row from Appwrite Database
   * @param id ID of the row to delete
   * @returns Promise<boolean> true if deletion was successful
   */
  async deleteRecord(id: string | number) {
    try {
      await database.deleteDocument(this.databaseId, this.collectionId, id.toString());
      return true;
    } catch (error) {
      console.error('Error deleting row:', error);
      throw new Error(`Failed to delete row: ${error}`);
    }
  }
    
}

// Export a singleton instance of the service
export const appwriteService = new AppwriteService();
