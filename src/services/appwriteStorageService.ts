import { storage, ID } from '../config/appwrite.config';
import { v4 as uuidv4 } from 'uuid';
import { StorageImage } from '../models/app-write.model';

/**
 * Appwrite Storage Service for image operations
 */
export class AppwriteStorageService {
  private bucketId: string;

  /**
   * Constructor for AppwriteStorageService
   * @param bucketId The ID of the Appwrite storage bucket (default: from APPWRITE_BUCKET_ID)
   */
  constructor(bucketId: string = process.env.REACT_APP_APPWRITE_BUCKET_ID || '') {
    this.bucketId = bucketId;
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
}

// Export a singleton instance of the service
export const appwriteStorageService = new AppwriteStorageService();
