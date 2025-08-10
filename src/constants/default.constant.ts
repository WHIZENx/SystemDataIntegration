import { QUERY_TYPE } from "../enums/query-type.enum";
import { Record } from "../models/record.model";

export const TABLE_NAME = "employees";

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

export const IS_AUTO_SEARCH = false;
export const AUTO_SEARCH_DELAY = 500;

export const IS_AUTO_UPLOAD = false;
export const AUTO_UPLOAD_PROGRESS_DELAY = 300;
export const AUTO_UPLOAD_DELAY = 1000;

export const DEFAULT_QUERY_TYPE = QUERY_TYPE.CONTAINS;
