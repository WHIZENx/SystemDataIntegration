import { Record } from "./record.model";

/**
 * Interface representing an image file stored in Appwrite Storage
 */
export interface StorageImage {
  id: string;
  name: string;
  url: string;
  fullPath: string;
  contentType?: string;
  size?: number;
  timeCreated?: string;
}

export interface RecordAppwrite extends Record {
  $collectionId: string;
  $databaseId: string;
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $sequence: number;
}
