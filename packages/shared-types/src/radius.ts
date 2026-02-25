export interface RadAcctSession {
  radacctId: number;
  acctSessionId: string;
  username: string;
  nasIpAddress: string;
  acctStartTime: string;
  acctStopTime: string | null;
  acctInputOctets: number;
  acctOutputOctets: number;
  acctTerminateCause: string | null;
  framedIpAddress: string;
  callingStationId: string; // Client MAC
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
