CREATE TYPE user_role AS ENUM ('student', 'organizer', 'admin');
CREATE TYPE event_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'student',
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INTEGER NOT NULL,
    organizer_id TEXT REFERENCES profiles(id),
    image_url TEXT,
    category TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'usd',
    status event_status DEFAULT 'pending',
    series_id UUID,
    recurrence_rule TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registrations (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id),
    qr_code_data TEXT UNIQUE NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_intent_id TEXT,
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE waitlist (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);
-- Add tables for promo_codes, ticket_tiers, and reviews similarly.