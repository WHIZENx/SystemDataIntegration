export interface NeonAuthResponse {
  access_token: string;
  expires_at_millis?: number;
  error?: string;
}

export interface NeonAPIResponse {
  data?: any;
  error?: string;
  message?: string;
}

interface IField {
  columnID: number;
  dataTypeID: number;
  dataTypeModifier: number;
  dataTypeSize: number;
  format: string;
  name: string;
  tableID: number;
}

export interface IDatabase<T> {
  command: string;
  fields: IField[];
  rowAsArray?: boolean;
  rowCount: number;
  rows: T[];
  viaNeonFetch?: boolean;
}