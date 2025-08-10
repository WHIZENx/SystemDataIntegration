// Define the Record interface
export interface Record {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  profileImage: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecordFormProps {
  record: Record | null;
  onSubmit: (data: Omit<Record, 'id'>) => Promise<void>;
  onCancel: (() => void) | null;
  loading: boolean;
  init: boolean;
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  profileImage: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormErrors {
  [key: string]: string;
}
