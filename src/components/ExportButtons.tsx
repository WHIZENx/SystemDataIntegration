import React from 'react';
import { Record } from '../App';
import { exportToGoogleSheets, exportToExcel, exportToCSV } from '../utils/exportUtils';

interface ExportButtonsProps {
  records: Record[];
  loading: boolean;
  isExporting: boolean;
  isExportingExcel: boolean;
  isExportingCSV: boolean;
  setIsExporting: (value: boolean) => void;
  setIsExportingExcel: (value: boolean) => void;
  setIsExportingCSV: (value: boolean) => void;
  setError: (value: string) => void;
  setSuccess: (value: string) => void;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  records,
  loading,
  isExporting,
  isExportingExcel,
  isExportingCSV,
  setIsExporting,
  setIsExportingExcel,
  setIsExportingCSV,
  setError,
  setSuccess
}) => {
  
  // Handler for Google Sheets export
  const handleExportToSheets = async (): Promise<void> => {
    if (records.length === 0) {
      setError('No records to export');
      return;
    }

    setIsExporting(true);
    setError('');
    setSuccess('');
    try {
      const exportedRecords = await exportToGoogleSheets(records);
      // Show success message
      setSuccess(`Successfully exported ${exportedRecords.length} records to Google Sheets!`);
    } catch (err) {
      setError('Failed to export records: ' + (err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handler for Excel export
  const handleExportToExcel = async (): Promise<void> => {
    if (records.length === 0) {
      setError('No records to export');
      return;
    }

    setIsExportingExcel(true);
    setError('');
    setSuccess('');
    try {
      await exportToExcel(records);
    } catch (err) {
      setError('Failed to export Excel file: ' + (err as Error).message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handler for CSV export
  const handleExportToCSV = async (): Promise<void> => {
    if (records.length === 0) {
      setError('No records to export');
      return;
    }

    setIsExportingCSV(true);
    setError('');
    setSuccess('');
    try {
      await exportToCSV(records);
    } catch (err) {
      setError('Failed to export CSV file: ' + (err as Error).message);
    } finally {
      setIsExportingCSV(false);
    }
  };
  
  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportToSheets}
        className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        disabled={loading || isExporting || records.length === 0}
        title="Export to Google Sheets"
      >
        {isExporting ? 'Exporting...' : 'Export to Sheets'}
      </button>
      <button
        onClick={handleExportToExcel}
        className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        disabled={loading || isExportingExcel || records.length === 0}
        title="Export to Excel (.xlsx)"
      >
        {isExportingExcel ? 'Exporting...' : 'Export Excel'}
      </button>
      <button
        onClick={handleExportToCSV}
        className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        disabled={loading || isExportingCSV || records.length === 0}
        title="Export to CSV (.csv)"
      >
        {isExportingCSV ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  );
};

export default ExportButtons;
