import { Record } from "./record.model";

export interface APIResponse {
  records?: Record[];
  record?: Record;
  error?: string;
}
