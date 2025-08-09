# Employee Management System with Dual Backend

A modern, responsive employee management application built with React and TypeScript that supports two different backends:
1. Google Sheets (using Google Apps Script as backend)
2. Neon Database (using a custom API service)

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

## 🔧 Employee Data Structure

Each employee record contains:
- `id`: Unique identifier
- `name`: Employee's full name
- `email`: Employee's email address
- `phone`: Employee's phone number
- `department`: Department name
- `position`: Job title/position

## 🚀 Setup Instructions

### Google Sheets Backend Setup

1. Create a new Google Sheet
2. Set up sheet with headers: ID, Name, Email, Phone, Department, Position
3. Create a new Google Apps Script project (Tools > Script Editor)
4. Copy the content from `google-apps-script.js` into the Script Editor
5. Replace `SHEET_ID` and `SHEET_NAME` variables with your actual Google Sheet details
6. Deploy as Web App with execute permissions set to "Anyone"
7. Copy the Web App URL to your `.env` file

### Neon Database Setup

1. Set the following environment variables in `.env` file:
```
REACT_APP_NEON_API_URL=your_neon_api_url
REACT_APP_NEON_API_KEY=your_api_key
```

### Local Development

1. Clone the repository
2. Install dependencies: `npm install --legacy-peer-deps`
3. Create `.env` file with necessary configurations (see `.env.example`)
4. Start the development server: `npm start` or `npm run dev`
5. Access the application at http://localhost:3000 or http://localhost:3002

## 📚 Usage Examples

### Google Sheets API

```typescript
import { GoogleSheetsAPI } from './services/googleSheetsAPI';

// Get all records
const records = await GoogleSheetsAPI.getAllRecords();

// Create new record
const newRecord = await GoogleSheetsAPI.createRecord({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0100',
  department: 'Engineering',
  position: 'Developer'
});
```

### Neon API

```typescript
import { NeonAPI } from './services/neonAPI';

// Get all employees
const employees = await NeonAPI.getAllEmployees();

// Create new employee
const newEmployee = await NeonAPI.createEmployee({
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-0200',
  department: 'Marketing',
  position: 'Manager'
});
```

## 🛠 Available Scripts

- `npm start` / `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm test`: Run tests

## 📄 License

This project is licensed under the MIT License.
