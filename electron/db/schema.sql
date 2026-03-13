-- Members Table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY, -- GYM00001234
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    qr_code TEXT UNIQUE NOT NULL,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('TIME_BASED', 'SESSION_BASED')) NOT NULL,
    duration_days INTEGER, -- Nullable if session based
    session_count INTEGER, -- Nullable if time based
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT 1
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT NOT NULL,
    plan_id INTEGER NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME, -- Nullable if strictly session based without expiry
    remaining_sessions INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')) DEFAULT 'ACTIVE',
    price_paid DECIMAL(10, 2) NOT NULL,
    auto_renew BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Access Logs Table
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT CHECK(type IN ('CHECK_IN', 'CHECK_OUT')) NOT NULL,
    status TEXT CHECK(status IN ('GRANTED', 'DENIED')) NOT NULL,
    denial_reason TEXT,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT NOT NULL,
    subscription_id INTEGER,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT CHECK(type IN ('SUBSCRIPTION', 'PRODUCT', 'REFUND')) NOT NULL,
    payment_method TEXT DEFAULT 'CASH',
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);
