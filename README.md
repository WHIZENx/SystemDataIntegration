# Employee Management System with Multiple Backend Integrations

A modern, responsive employee management application built with React and TypeScript that supports multiple backend integration options:
1. Google Sheets (using Google Sheets API)
2. Neon Database (PostgreSQL serverless database)
3. Firebase (Realtime Database)
4. Appwrite (Cloud storage for files/images)

## 📋 Features

- **Complete CRUD Operations**: Create, read, update, and delete employee records
- **Search Functionality**: Search for employees by name
- **Export Capabilities**: Export data to Excel or CSV formats
- **Dual Backend Support**: Switch between Google Sheets API and Neon Database
- **Responsive UI**: Modern interface built with Tailwind CSS

## 🧩 Project Structure

### Frontend (React/TypeScript)
- Built with React 19 and TypeScript
- Styled with Tailwind CSS
- Export functionality using xlsx library

### Backend Options

#### 1. Google Sheets API
- Backend implementation using Google Apps Script
- Provides REST API endpoints for CRUD operations
- Data stored in Google Sheets

#### 2. Neon Database
- Custom API service implementation for PostgreSQL database
- Authentication with token refresh mechanism
- Environment variables for configuration

## 🔧 For example: Employee Data Structure

Each employee record contains:
- `id`: Unique identifier
- `name`: Employee's full name
- `email`: Employee's email address
- `phone`: Employee's phone number
- `department`: Department name
- `position`: Job title/position
- `profile_image`: URL to employee's profile image
- `status`: Employee's status (e.g., active, inactive)
- `created_at`: Timestamp of record creation
- `updated_at`: Timestamp of last update

## 🚀 Setup Instructions

### Environment Variables

Create a `.env` file in the root directory with the following variables as needed for your chosen backend integration:

```
# Google Sheets API
REACT_APP_GOOGLE_SCRIPT_URL=your_google_script_url
REACT_APP_GOOGLE_SCRIPT_ID=your_script_id

# Neon Database
REACT_APP_NEON_API_URL=your_neon_api_url
REACT_APP_NEON_AUTH_URL=your_neon_auth_url
REACT_APP_NEON_PUBLIC_STACK_PROJECT_ID=your_stack_project_id
REACT_APP_NEON_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key
REACT_APP_NEON_SECRET_SERVER_KEY=your_server_key
REACT_APP_NEON_REFRESH_TOKEN=your_refresh_token
REACT_APP_NEON_AUTH_USER_ID=your_auth_user_id
REACT_APP_DB_URL=your_neon_db_url

# Firebase
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_DATABASE_URL=your_firebase_database_url

# Appwrite
REACT_APP_APPWRITE_ENDPOINT=your_appwrite_endpoint
REACT_APP_APPWRITE_PROJECT_ID=your_appwrite_project_id
REACT_APP_APPWRITE_BUCKET_ID=your_appwrite_bucket_id
```

### Constants Variables

Constants are defined in the `src/constants/default.constant.ts` file.

```typescript
export const TABLE_NAME = "employees"; // Table name for database

// Default employee object
export const DEFAULT_EMPLOYEE: Record = {
  id: 0,
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  profile_image: '',
  status: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const IS_AUTO_SEARCH = false; // Auto search when typing
export const AUTO_SEARCH_DELAY = 500; // Auto search delay in milliseconds

export const IS_AUTO_UPLOAD = false; // Auto upload when typing
export const AUTO_UPLOAD_PROGRESS_DELAY = 300; // Auto upload progress delay in milliseconds
export const AUTO_UPLOAD_DELAY = 1000; // Auto upload delay in milliseconds

export const DEFAULT_QUERY_TYPE = QUERY_TYPE.CONTAINS; // Default query type
```

### Google Sheets API Setup

1. **Create and Configure Google Sheet**:
   - Create a new Google Sheet
   - Set up sheet with headers: ID, Name, Email, Phone, Department, Position

2. **Enable Google Sheets API**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to APIs & Services > Library
   - Search for and enable "Google Sheets API"

3. **Create Google Apps Script**:
   - Open your Google Sheet
   - Click Tools > Script Editor to open Apps Script
   - Copy the content from `google-apps-script.js` into the editor
   - Replace `SHEET_ID` with your Google Sheet ID (found in the sheet URL)
   - Replace `SHEET_NAME` with your sheet name (default is 'Sheet1')
   - Add more columns to `COLUMNS` object if needed

4. **Deploy as Web App**:
   - Click Deploy > New deployment
   - Select type: Web app
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click Deploy and authorize the app
   - Copy the Web App URL 

5. **Configure Environment Variables**:
   - Add the URL to your `.env` file as `REACT_APP_GOOGLE_SCRIPT_URL`
   - Or extract the script ID from the URL and set it as `REACT_APP_GOOGLE_SCRIPT_ID`

### Neon Database Setup

1. **Create Neon Account and Project**:
   - Sign up at [Neon](https://neon.tech/)
   - Create a new project
   - Create a new database or use the default one

2. **Database Connection**:
   - From your project dashboard, obtain the connection string
   - Add it to your `.env` file as `REACT_APP_DB_URL`

3. **API Configuration**:
   - Set up the required API environment variables:
     - `REACT_APP_NEON_API_URL`: Your API endpoint
     - `REACT_APP_NEON_AUTH_URL`: Authentication endpoint
     - Other required Neon variables as shown above

4. **Set Up Database Schema**:
   - The application automatically creates the table structure during initialization
   - The schema includes: id, name, email, phone, department, position, etc.

### Firebase Setup

1. **Create Firebase Project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database service

2. **Database Rules**:
   - Configure your database rules to allow read/write access
   - Example rules for development (more restrictive rules recommended for production):
     ```json
     {
       "rules": {
         ".read": true,
         ".write": true,
         // Optional
         `${TABLE_NAME}`: {
            ".onIndex": [], // for search by column
            ".read": true,
            ".write": true
         }
       }
     }
     ```

3. **Firebase Configuration**:
   - In the Firebase console, go to Project Settings > General
   - Scroll down to "Your apps" and create a web app if needed
   - Copy the configuration object values to your `.env` file

4. **Initialize Database Structure**:
   - The application automatically initializes the database structure
   - No manual setup required for the data structure

### Appwrite Storage Setup

1. **Create Appwrite Account and Project**:
   - Sign up at [Appwrite](https://appwrite.io/)
   - Create a new project
   - Set up a platform by adding a Web app

2. **Create Storage Bucket**:
   - Go to your project > Storage
   - Create a new bucket for storing employee profile images
   - Configure bucket permissions:
     - Enable read access for all users
     - Restrict write access to authenticated users

3. **Copy Configuration Details**:
   - From your Appwrite console, get your endpoint and project ID
   - Copy the bucket ID from the storage bucket you created
   - Add these values to your `.env` file

4. **CORS Configuration**:
   - Make sure your Appwrite instance has appropriate CORS settings
   - Add your frontend URL to the allowed origins

### Local Development

1. Clone the repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Create `.env` file with necessary configurations as described above
4. Start the development server: `npm start` or `npm run dev`
5. Access the application at http://localhost:3000 or http://localhost:3002

## 📚 Usage Examples

### Google Sheets API

```typescript
import { GoogleSheetsAPI } from './services/googleSheetsAPI';

// Initialize sheet (creates headers if needed)
await GoogleSheetsAPI.initSheet();

// Get all records
const records = await GoogleSheetsAPI.getAllRecords();

// Create new record
const newRecord = await GoogleSheetsAPI.createRecord({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0100',
  department: 'Engineering',
  position: 'Developer',
  profile_image: '',
  status: 1,
  created_at: '2025-08-11T00:53:38.000Z',
  updated_at: '2025-08-11T00:53:38.000Z',
});

// Update existing record
await GoogleSheetsAPI.updateRecord(1, {
  name: 'John Doe Updated',
  position: 'Senior Developer'
});

// Delete a record
await GoogleSheetsAPI.deleteRecord(1);
```

### Neon Database API

```typescript
import { NeonAPI } from './services/neonAPI';

// Initialize database (creates table if needed)
await NeonAPI.createDbEmployee();

// Get all employees
const employees = await NeonAPI.getAllEmployees();

// Create new employee
const newEmployee = await NeonAPI.createEmployee({
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-0200',
  department: 'Marketing',
  position: 'Manager',
  profile_image: '',
  status: 1,
  created_at: '2025-08-11T00:53:38.000Z',
  updated_at: '2025-08-11T00:53:38.000Z',
});

// Update employee
await NeonAPI.updateEmployee(1, {
  department: 'Product Marketing',
  position: 'Senior Manager'
});

// Delete employee
await NeonAPI.deleteEmployee(1);
```

### Firebase Database

```typescript
import { FirebaseService } from './services/firebaseService';

const firebaseService = new FirebaseService();

// Initialize database structure
await firebaseService.initDatabaseStructure();

// Get all records
const records = await firebaseService.getAllRecords();

// Create new record
const newRecord = await firebaseService.createRecord({
  name: 'Robert Johnson',
  email: 'robert@example.com',
  phone: '555-0300',
  department: 'IT',
  position: 'System Administrator',
  profile_image: '',
  status: 1,
  created_at: '2025-08-11T00:53:38.000Z',
  updated_at: '2025-08-11T00:53:38.000Z',
});

// Update record
await firebaseService.updateRecord(1, {
  position: 'IT Manager'
});

// Delete record
await firebaseService.deleteRecord(1);
```

### Appwrite Storage

```typescript
import { AppwriteStorageService } from './services/appwriteStorageService';

const storageService = new AppwriteStorageService();

// Upload image
const file = new File([/* your file data */], 'profile.jpg', { type: 'image/jpeg' });
const uploadedImage = await storageService.uploadImage(file);

// Get image URL
const imageUrl = await storageService.getImageUrl(uploadedImage.id);

// Get all images
const allImages = await storageService.getAllImages();

// Delete image
await storageService.deleteImage(uploadedImage.id);
```

## 🛠 Available Scripts

- `npm start` / `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm test`: Run tests
- `npm run lint`: Run linting
- `npm run lint:fix`: Run linting and fix

## 📄 License

This project is licensed under the MIT License.
