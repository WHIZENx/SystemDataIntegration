import React, { useState, useEffect, useRef } from 'react';
import { FormData, FormErrors, RecordFormProps } from '../models/record.model';
import { appwriteService } from '../services/appwriteService';

const RecordForm: React.FC<RecordFormProps> = ({ record, onSubmit, onCancel, loading, init }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    profile_image: '',
    status: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prevProfileImage, setPrevProfileImage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (record) {
      setFormData({
        name: record.name || '',
        email: record.email || '',
        phone: record.phone || '',
        department: record.department || '',
        position: record.position || '',
        profile_image: record.profile_image || '',
        status: record.status || 0,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || new Date().toISOString(),
      });
      
      // Load image preview if profile_image exists
      if (record.profile_image) {
        loadImagePreview(record.profile_image);
      }
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        profile_image: '',
        status: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setImagePreview('');
    }
    setErrors({});
    setImageFile(null);
  }, [record]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone?.toString().trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (!formData.department?.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.position?.trim()) {
      newErrors.position = 'Position is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadImagePreview = async (fileId: string) => {
    try {
      setPrevProfileImage(fileId);
      if (fileId) {
        const imageUrl = await appwriteService.viewImage(fileId);
        setImagePreview(imageUrl);
      }
    } catch (error) {
      console.error('Error loading image preview:', error);
      setImagePreview('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview('');
    
    // Only clear the form data if we're updating the form data directly
    // Otherwise wait for form submission to handle deletion
    setFormData(prev => ({
      ...prev,
      profile_image: ''
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    
    if (!validateForm()) {
      setSubmitting(false);
      return;
    }

    let updatedFormData = {...formData, phone: formData.phone?.toString() || ''};

    try {
      // Handle image upload if there's a new image
      if (imageFile) {
        // Upload new image
        const uploadResult = await appwriteService.uploadImage(imageFile);
        updatedFormData.profile_image = uploadResult.id;
      }

      // Handle image deletion if image was removed and there was a previous image
      if ((prevProfileImage || !imageFile) && prevProfileImage !== updatedFormData.profile_image) {
        // Delete the old image if needed
        await appwriteService.deleteImage(prevProfileImage);
      }

      // If same old image, just keep the ID
      
      // Submit the updated form data
      onSubmit(updatedFormData);
    } catch (error) {
      console.error('Error processing image:', error);
      // Still submit the form without image changes if there's an error
      onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleReset = (): void => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      profile_image: '',
      status: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setErrors({});
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
          placeholder="Enter full name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
          placeholder="Enter email address"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.phone ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
          placeholder="Enter phone number"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Department
        </label>
        <select
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.department ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
        >
          <option value="">Select department</option>
          <option value="Engineering">Engineering</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="HR">Human Resources</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
        </select>
        {errors.department && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>}
      </div>

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Position
        </label>
        <input
          type="text"
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.position ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
          placeholder="Enter job position"
        />
        {errors.position && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.position}</p>}
      </div>

      <div>
        <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Profile Image
        </label>
        <div className="mt-1 flex items-center space-x-4">
          <div className="flex-shrink-0 h-24 w-24 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Profile preview" 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <div>
              <input
                type="file"
                id="profile_image"
                name="profile_image"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="sr-only"
              />
              <label 
                htmlFor="profile_image"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </label>
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={handleImageRemove}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove Image
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading || submitting}
          className={`flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
            loading || submitting
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {!init ? 'Loading...' : loading ? 'Saving...' : (record ? submitting ? 'Updating...' : 'Update' : submitting ? 'Creating...' : 'Create')}
        </button>
        
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || submitting}
            className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || submitting}
            className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
};

export default RecordForm;
