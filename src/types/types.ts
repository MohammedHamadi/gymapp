export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  qr_code: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  type: "TIME_BASED" | "SESSION_BASED";
  duration_days: number | null;
  session_count: number | null;
  price: number;
  is_active: number; // SQLite BOOLEAN (0 or 1)
}

export interface Subscription {
  id: number;
  member_id: string;
  plan_id: number;
  start_date: string;
  end_date: string | null;
  remaining_sessions: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  price_paid: number;
  auto_renew: number; // SQLite BOOLEAN (0 or 1)
  created_at: string;
}

export interface AccessLog {
  id: number;
  member_id: string;
  timestamp: string;
  type: "CHECK_IN" | "CHECK_OUT";
  status: "GRANTED" | "DENIED";
  denial_reason: string | null;
}

export interface Transaction {
  id: number;
  member_id: string;
  subscription_id: number | null;
  amount: number;
  transaction_date: string;
  type: "SUBSCRIPTION" | "PRODUCT" | "REFUND";
  payment_method: string;
}
