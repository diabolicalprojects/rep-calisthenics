-- Extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'coach', -- 'developer', 'admin', 'coach'
    permissions JSONB DEFAULT '{}', -- For coaches: { "inventory": true, "payments": false, etc. }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Members
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    plan TEXT,
    status TEXT DEFAULT 'active',
    join_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    photo_url TEXT,
    signature_data TEXT,
    last_visit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Memberships (Plans)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER DEFAULT 30,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    category TEXT,
    min_stock INTEGER DEFAULT 5,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions (POS)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    cashier_id UUID REFERENCES users(id),
    cashier_name TEXT,
    items JSONB, -- Array of items sold
    type TEXT DEFAULT 'retail', -- 'retail', 'subscription', 'visit'
    status TEXT DEFAULT 'Pagado',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- General Payments (Accounting)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_name TEXT,
    member_id UUID REFERENCES members(id),
    concept TEXT,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Pagado',
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visits (Access Log)
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    member_name TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Support Requests (For password resets etc)
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL, -- e.g., 'password_reset'
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agenda (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    member_name TEXT,
    member_id UUID REFERENCES members(id),
    time TEXT,
    date TEXT,
    duration TEXT,
    status TEXT DEFAULT 'Pendiente',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routines
CREATE TABLE IF NOT EXISTS routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    name TEXT NOT NULL,
    level TEXT,
    focus TEXT,
    icon TEXT,
    description TEXT,
    exercises JSONB,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data
-- Admin Default (password will be hashed by initDB if plain text)
INSERT INTO users (name, email, username, password, role) 
VALUES ('Administrador', 'admin@gym.com', 'admin', 'Diabolical1502', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Developer (Superadmin, password will be hashed by initDB if plain text)
INSERT INTO users (name, username, email, password, role) 
VALUES ('Developer', 'DiabolicalDev', 'dev@diabolical.com', 'Diabolical1502', 'developer')
ON CONFLICT (username) DO NOTHING;

INSERT INTO memberships (name, price, duration_days) VALUES 
('Básico', 350.00, 30),
('Pro', 600.00, 30),
('Piso Libre', 450.00, 30)
ON CONFLICT (name) DO NOTHING;

INSERT INTO inventory (name, price, quantity, category) VALUES 
('Proteína Whey 1kg', 850.00, 15, 'Suplementos'),
('Creatina 300g', 450.00, 10, 'Suplementos'),
('Agua 600ml', 15.00, 50, 'Bebidas')
ON CONFLICT DO NOTHING;
