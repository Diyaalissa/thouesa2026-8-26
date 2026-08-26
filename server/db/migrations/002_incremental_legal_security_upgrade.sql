-- =========================================================================
-- MIGRATION: 002_incremental_legal_security_upgrade.sql
-- TARGET: MariaDB / MySQL InnoDB (cPanel Compatible)
-- OBJECTIVE: Add security seal, 360° inspection photos, legal waiver, 
--            status enums expansion, and exchange rate freeze.
-- =========================================================================

-- 1. Add Inspection, Security Seal, and Legal Waiver columns to shipments
ALTER TABLE shipments 
ADD COLUMN security_seal_id VARCHAR(50) AFTER actual_weight_kg,
ADD COLUMN inspection_photos JSON AFTER security_seal_id, -- Array of photo URLs taken at Hub
ADD COLUMN inspection_notes TEXT AFTER inspection_photos,
ADD COLUMN sender_legal_waiver_signed BOOLEAN DEFAULT FALSE AFTER current_status,
ADD COLUMN sender_legal_waiver_timestamp DATETIME AFTER sender_legal_waiver_signed,
ADD COLUMN insurance_fee DECIMAL(10, 2) DEFAULT 0.00 AFTER shipping_cost,
ADD COLUMN payment_method VARCHAR(30) DEFAULT 'WALLET' AFTER insurance_fee,
ADD COLUMN payment_local_amount DECIMAL(12, 2) DEFAULT 0.00 AFTER payment_method;

-- 2. Enhance shipments current_status ENUM with new states
ALTER TABLE shipments 
MODIFY COLUMN current_status ENUM(
    'DRAFT', 
    'PENDING_HUB_DROPOFF', 
    'RECEIVED_AT_ORIGIN', 
    'INSPECTED_SEALED', 
    'WEIGHT_ADJUSTMENT_PENDING', 
    'ASSIGNED_TO_TRIP', 
    'IN_TRANSIT', 
    'RECEIVED_AT_DEST', 
    'READY_FOR_PICKUP', 
    'DELIVERED', 
    'CANCELLED', 
    'REJECTED_PROHIBITED', 
    'DISPUTED'
) DEFAULT 'PENDING_HUB_DROPOFF';

-- 3. Enhance trips status ENUM for flight exception handling
ALTER TABLE trips 
MODIFY COLUMN status ENUM(
    'SUBMITTED', 
    'VERIFIED', 
    'ESCROW_LOCKED', 
    'DISPATCHED', 
    'IN_FLIGHT', 
    'ARRIVED', 
    'COMPLETED', 
    'CANCELLED', 
    'DELAYED',
    'EMERGENCY_UNASSIGNED'
) DEFAULT 'SUBMITTED';

-- 4. Add Exchange Rate Freeze to financial transactions
ALTER TABLE financial_transactions 
ADD COLUMN exchange_rate_to_usd DECIMAL(10, 4) DEFAULT 1.0000 AFTER currency,
ADD COLUMN local_currency_amount DECIMAL(12, 2) DEFAULT 0.00 AFTER exchange_rate_to_usd,
ADD COLUMN payment_gateway VARCHAR(30) DEFAULT 'WALLET' AFTER local_currency_amount;
