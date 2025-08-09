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