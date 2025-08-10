import React, { useState, useEffect, useRef } from 'react';
import { appwriteStorageService } from '../services/appwriteStorageService';
import { StorageImage } from '../models/app-write.model';
import { createAnonymousSession } from '../config/appwrite.config';
import { AUTO_UPLOAD_DELAY, AUTO_UPLOAD_PROGRESS_DELAY, IS_AUTO_UPLOAD } from '../constants/default.constant';

const ImageGallery: React.FC<{ activePage: string }> = ({ activePage }) => {
  const [images, setImages] = useState<StorageImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images on component mount
  useEffect(() => {
    if (activePage === 'gallery') {
    const initializeAppwrite = async () => {
      try {
        console.log('Initializing Appwrite session...');
        const sessionCreated = await createAnonymousSession();
        console.log('Appwrite session initialized:', sessionCreated);
        
        if (sessionCreated) {
          await loadImages();
        } else {
          setError('Failed to create Appwrite session. Check console for details.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing Appwrite:', err);
        setError('Failed to initialize Appwrite. Please check your configuration.');
        setLoading(false);
      }
    };
    
    initializeAppwrite();
    }
  }, [activePage]);

  // Function to load all images from Appwrite Storage
  const loadImages = async () => {
    try {
      setLoading(true);
      const imagesList = await appwriteStorageService.getAllImages();
      setImages(imagesList);
      setError('');
    } catch (err) {
      console.error('Failed to load images:', err);
      setError('Failed to load images. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    
    const file = files[0];
    setSelectedFile(file);
    
    if (IS_AUTO_UPLOAD) {
      try {
        setUploading(true);
        setUploadProgress(10); // Start progress
        
        // Simulate progress - in a real app, you'd use Firebase upload progress events
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, AUTO_UPLOAD_PROGRESS_DELAY);
        
        // Upload the file
        await appwriteStorageService.uploadImage(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        // Refresh the image list
        await loadImages();
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          setSelectedFile(null);
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
        setError('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), AUTO_UPLOAD_DELAY);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.error('No file selected');
      return;
    }
    const file = selectedFile;
    try {
      setUploading(true);
      await appwriteStorageService.uploadImage(file);
      await loadImages();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (image: StorageImage) => {
    if (!window.confirm(`Are you sure you want to delete "${image.name}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await appwriteStorageService.deleteImage(image.id);
      
      // Update the images list after deletion
      setImages(images.filter(img => img.id !== image.id));
      setError('');
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle image download
  const handleDownloadImage = async (image: StorageImage) => {
    try {
      // Get download URL from service
      const downloadUrl = await appwriteStorageService.downloadImage(image.id);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = image.name || `download-${image.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Failed to download image:', err);
      setError('Failed to download image. Please try again.');
    }
  };

  const handleViewImage = async (image: StorageImage) => {
    try {
      // Get view URL from service
      const viewUrl = await appwriteStorageService.viewImage(image.id);
      
      window.open(viewUrl, '_blank');
    } catch (err) {
      console.error('Failed to view image:', err);
      setError('Failed to view image. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:text-white">
      <h1 className="text-2xl font-bold mb-6">Image Gallery</h1>
      
      {/* Upload section */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl mb-2 dark:text-gray-200">Upload New Image</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            ref={fileInputRef}
            className="border rounded px-3 py-2 w-full md:w-auto dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          
          {/* Upload button - you could use this instead of auto-upload on file select */}
          {!IS_AUTO_UPLOAD && <button 
            onClick={handleUpload} 
            disabled={!selectedFile || uploading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>}
         
        </div>
        
        {/* Upload progress bar */}
        {uploadProgress > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded">
              <div 
                className="h-full bg-blue-500 rounded" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-right mt-1">{uploadProgress}%</p>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-100 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      )}
      
      {/* Image gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative group rounded-lg overflow-hidden shadow-lg">
            <img 
              src={image.url} 
              alt={image.name} 
              className="w-full h-48 object-cover"
            />
            
            <div className="absolute inset-0 bg-black dark:bg-opacity-30 bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity duration-300">
              <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                {/* <a 
                  href={image.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                  title="Open original"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </a> */}
                <button 
                  onClick={() => handleViewImage(image)}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                  title="View image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDownloadImage(image)}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded"
                  title="Download image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDeleteImage(image)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                  title="Delete image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Image name */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 dark:bg-opacity-70 text-white p-2 text-sm truncate">
              {image.name}
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {!loading && images.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No images</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload an image to get started.</p>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
