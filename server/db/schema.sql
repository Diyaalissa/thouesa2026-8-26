-- =========================================================================
-- THOUESA (ثويسا) - Cross-Border P2P Logistics & Escrow Platform
-- Database Schema for MariaDB / MySQL InnoDB (cPanel Compatible)
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users & Roles
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS financial_transactions;
DROP TABLE IF EXISTS escrow_wallets;
DROP TABLE IF EXISTS disputes;
DROP TABLE IF EXISTS manifest_items;
DROP TABLE IF EXISTS manifests;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS hubs;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('SENDER', 'TRAVELER', 'HUB_AGENT', 'HUB_MANAGER', 'MASTER_ADMIN') DEFAULT 'SENDER',
    kyc_status ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'UNVERIFIED',
    is_active BOOLEAN DEFAULT TRUE,
    preferred_locale ENUM('ar', 'en') DEFAULT 'ar',
    avatar_url VARCHAR(255),
    passport_number VARCHAR(50),
    national_id VARCHAR(50),
    rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_kyc (kyc_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Country Hubs
CREATE TABLE hubs (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., AMM-01, ALG-01, CAI-01, RUH-01
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL, -- JOR, DZA, EGY, SAU
    country_name_ar VARCHAR(100) NOT NULL,
    country_name_en VARCHAR(100) NOT NULL,
    city_ar VARCHAR(100) NOT NULL,
    city_en VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    storage_capacity_kg DECIMAL(10, 2) DEFAULT 1000.00,
    current_used_kg DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Traveler Trips
CREATE TABLE trips (
    id VARCHAR(36) PRIMARY KEY,
    traveler_id VARCHAR(36) NOT NULL,
    origin_hub_id VARCHAR(36) NOT NULL,
    destination_hub_id VARCHAR(36) NOT NULL,
    airline VARCHAR(100) NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    pnr_code VARCHAR(20) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    available_weight_kg DECIMAL(6, 2) NOT NULL,
    allocated_weight_kg DECIMAL(6, 2) DEFAULT 0.00,
    price_per_kg_earned DECIMAL(8, 2) NOT NULL,
    total_earnings_estimated DECIMAL(10, 2) DEFAULT 0.00,
    required_escrow_deposit DECIMAL(10, 2) DEFAULT 0.00,
    is_escrow_paid BOOLEAN DEFAULT FALSE,
    status ENUM('SUBMITTED', 'VERIFIED', 'ESCROW_LOCKED', 'ESCROW_PAID', 'DISPATCHED', 'IN_FLIGHT', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'DELAYED', 'EMERGENCY_UNASSIGNED') DEFAULT 'SUBMITTED',
    ticket_doc_url VARCHAR(255),
    emergency_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (origin_hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    INDEX idx_trip_status (status),
    INDEX idx_trip_route (origin_hub_id, destination_hub_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Shipments
CREATE TABLE shipments (
    id VARCHAR(36) PRIMARY KEY,
    tracking_number VARCHAR(35) UNIQUE NOT NULL, -- e.g. TH-JOR-ALG-202608-8841
    sender_id VARCHAR(36) NOT NULL,
    origin_hub_id VARCHAR(36) NOT NULL,
    destination_hub_id VARCHAR(36) NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_national_id VARCHAR(50),
    item_category VARCHAR(50) NOT NULL,
    item_description TEXT NOT NULL,
    item_photos JSON,
    inspection_photos JSON,
    declared_value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    estimated_weight_kg DECIMAL(6, 2) NOT NULL,
    actual_weight_kg DECIMAL(6, 2),
    length_cm DECIMAL(6, 2) DEFAULT 20.00,
    width_cm DECIMAL(6, 2) DEFAULT 20.00,
    height_cm DECIMAL(6, 2) DEFAULT 20.00,
    security_seal_id VARCHAR(50), -- e.g. SEAL-AMM-98231
    shipping_cost DECIMAL(10, 2) NOT NULL,
    insurance_fee DECIMAL(10, 2) DEFAULT 0.00,
    customs_duty_estimated DECIMAL(10, 2) DEFAULT 0.00,
    escrow_deposit_required DECIMAL(10, 2) NOT NULL,
    current_status ENUM('DRAFT', 'PENDING_HUB_DROPOFF', 'PENDING_DROPOFF', 'RECEIVED_AT_ORIGIN', 'INSPECTED_SEALED', 'INSPECTED_AND_SEALED', 'WEIGHT_ADJUSTMENT_PENDING', 'WEIGHT_DISCREPANCY_PENDING', 'ASSIGNED_TO_TRIP', 'IN_TRANSIT', 'RECEIVED_AT_DEST', 'READY_FOR_PICKUP', 'DELIVERED', 'REJECTED_PROHIBITED', 'DISPUTED', 'CANCELLED') DEFAULT 'PENDING_HUB_DROPOFF',
    sender_legal_waiver_signed BOOLEAN DEFAULT FALSE,
    sender_legal_waiver_timestamp DATETIME,
    payment_method VARCHAR(30) DEFAULT 'WALLET',
    payment_local_amount DECIMAL(12, 2) DEFAULT 0.00,
    assigned_trip_id VARCHAR(36),
    inspection_notes TEXT,
    inspected_by_agent_id VARCHAR(36),
    inspected_at DATETIME,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    weight_discrepancy JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (origin_hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    INDEX idx_shipment_tracking (tracking_number),
    INDEX idx_shipment_status (current_status),
    INDEX idx_shipment_sender (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Manifest Batches
CREATE TABLE manifests (
    id VARCHAR(36) PRIMARY KEY,
    manifest_code VARCHAR(30) UNIQUE NOT NULL,
    trip_id VARCHAR(36) NOT NULL,
    traveler_id VARCHAR(36) NOT NULL,
    origin_hub_id VARCHAR(36) NOT NULL,
    destination_hub_id VARCHAR(36) NOT NULL,
    dispatched_by_agent_id VARCHAR(36) NOT NULL,
    received_by_agent_id VARCHAR(36),
    total_packages INT DEFAULT 0,
    total_weight_kg DECIMAL(6, 2) DEFAULT 0.00,
    total_declared_value DECIMAL(12, 2) DEFAULT 0.00,
    handover_qr_secret VARCHAR(255) NOT NULL,
    dispatch_timestamp DATETIME,
    receipt_timestamp DATETIME,
    status ENUM('PREPARING', 'HANDED_OVER', 'IN_FLIGHT', 'DELIVERED_TO_DEST_HUB', 'DISCREPANCY_FLAGGED') DEFAULT 'PREPARING',
    tamper_seal_ids JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE RESTRICT,
    FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (dispatched_by_agent_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by_agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Escrow Wallets
CREATE TABLE escrow_wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    locked_escrow_deposit DECIMAL(12, 2) DEFAULT 0.00,
    pending_earnings DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Immutable Financial Ledger
CREATE TABLE financial_transactions (
    id VARCHAR(36) PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    wallet_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36),
    shipment_id VARCHAR(36),
    type ENUM('SHIPPING_PAYMENT', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'TRAVELER_PAYOUT', 'REFUND', 'HUB_FEE', 'DISPUTE_FORFEIT', 'PRICE_ADJUSTMENT') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate_to_usd DECIMAL(10, 4) DEFAULT 1.0000,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('PENDING', 'COMMITTED', 'REVERTED', 'FAILED') DEFAULT 'COMMITTED',
    reference_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES escrow_wallets(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
    INDEX idx_fin_tx_user (user_id),
    INDEX idx_fin_tx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Disputes & Claims
CREATE TABLE disputes (
    id VARCHAR(36) PRIMARY KEY,
    shipment_id VARCHAR(36) NOT NULL,
    tracking_number VARCHAR(35) NOT NULL,
    claimant_id VARCHAR(36) NOT NULL,
    claimant_name VARCHAR(150) NOT NULL,
    respondent_id VARCHAR(36),
    reason ENUM('DAMAGED_ITEM', 'TAMPERED_SEAL', 'FLIGHT_DELAY_EXTREME', 'PROHIBITED_GOODS_DISCOVERED', 'MISSING_PACKAGE') NOT NULL,
    description TEXT NOT NULL,
    evidence_photos JSON,
    claim_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUND', 'RESOLVED_ESCROW_RELEASE', 'REJECTED') DEFAULT 'OPEN',
    resolution_notes TEXT,
    resolved_by_admin_id VARCHAR(36),
    resolved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT,
    FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Silent Audit Logs
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id VARCHAR(36) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_domain (domain),
    INDEX idx_audit_actor (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
