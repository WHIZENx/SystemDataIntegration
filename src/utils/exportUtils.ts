import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Record } from '../App';
import { GoogleSheetsAPI } from '../services/googleSheetsAPI';

/**
 * Format records for export with proper casing
 */
export const formatRecordsForExport = (records: Record[]) => {
  return records.map(record => ({
    ID: record.id,
    Name: record.name,
    Email: record.email,
    Phone: record.phone,
    Department: record.department,
    Position: record.position
  }));
};

/**
 * Export records to Google Sheets
 */
export const exportToGoogleSheets = async (records: Record[]): Promise<Record[]> => {
  if (records.length === 0) {
    throw new Error('No records to export');
  }
  
  // Prepare data for export (include IDs for updating existing sheets)
  const exportData = records.map(record => ({
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    department: record.department,
    position: record.position
  }));

  // Export to Google Sheets
  return await GoogleSheetsAPI.modifyMultipleRecords(exportData);
};

/**
 * Export records to Excel format
 */
export const exportToExcel = async (records: Record[]): Promise<void> => {
  if (records.length === 0) {
    throw new Error('No records to export');
  }

  // Format data for Excel
  const exportData = formatRecordsForExport(records);

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const fileData = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  // Save file with current date
  saveAs(fileData, `employees_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Export records to CSV format
 */
export const exportToCSV = async (records: Record[]): Promise<void> => {
  if (records.length === 0) {
    throw new Error('No records to export');
  }

  // Format data for CSV
  const exportData = formatRecordsForExport(records);

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Convert to CSV
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  
  // Create a blob with the data
  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  
  // Save file with current date
  saveAs(csvBlob, `employees_${new Date().toISOString().split('T')[0]}.csv`);
};
