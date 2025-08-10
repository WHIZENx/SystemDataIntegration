import { Record } from "../models/record.model";

export const TABLE_NAME = "employees";

export const DEFAULT_EMPLOYEE: Record = {
  id: 0,
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
};

export const IS_AUTO_SEARCH = false;
export const AUTO_SEARCH_DELAY = 500;

export const IS_AUTO_UPLOAD = false;
export const AUTO_UPLOAD_PROGRESS_DELAY = 300;
export const AUTO_UPLOAD_DELAY = 1000;