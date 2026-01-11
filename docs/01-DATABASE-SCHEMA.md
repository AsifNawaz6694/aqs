# DATABASE SCHEMA - ENHANCED FOR LARAVEL 12

## Overview

This document defines the complete database schema for the Rental Quotation System (RQS), optimized for Laravel 12 with proper relationships, indexes, and security considerations.

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────────┐        │
│  │    users    │────────▶│    roles    │◀───────▶│   permissions   │        │
│  └──────┬──────┘         └─────────────┘         └─────────────────┘        │
│         │                       │                         │                  │
│         │                       │                         │                  │
│         ▼                       ▼                         │                  │
│  ┌─────────────┐         ┌─────────────────┐             │                  │
│  │  profiles   │         │ role_permission │◀────────────┘                  │
│  └─────────────┘         └─────────────────┘                                │
│         │                                                                    │
│         │                                                                    │
│  ┌──────┴──────────────────────────────────────────────────────┐            │
│  │                                                              │            │
│  ▼                       ▼                       ▼              │            │
│  ┌─────────────────┐  ┌─────────────┐  ┌────────────────┐      │            │
│  │two_factor_codes │  │   products  │  │    clients     │      │            │
│  └─────────────────┘  └─────────────┘  └────────────────┘      │            │
│                              │                │                 │            │
│                              │                │                 │            │
│                              ▼                ▼                 │            │
│                       ┌────────────────────────────────────────┘            │
│                       │                                                      │
│                       ▼                                                      │
│                ┌─────────────────┐                                          │
│                │  activity_logs  │  (Polymorphic: subject, causer)          │
│                └─────────────────┘                                          │
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐                         │
│  │ password_reset_tokens│    │      sessions       │                         │
│  └─────────────────────┘    └─────────────────────┘                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. USERS TABLE

```sql
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Basic Information
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL DEFAULT NULL,

    -- Password Setup (for new users via admin creation)
    `password_setup_token` VARCHAR(255) NULL DEFAULT NULL,
    `password_setup_token_expires_at` TIMESTAMP NULL DEFAULT NULL,
    `password_set` TINYINT(1) NOT NULL DEFAULT 0,

    -- Role Assignment
    `role_id` BIGINT UNSIGNED NULL DEFAULT NULL,

    -- Email Signature (HTML)
    `signature_html` TEXT NULL DEFAULT NULL,

    -- Account Status
    `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    `last_login_ip` VARCHAR(45) NULL DEFAULT NULL,

    -- Timestamps
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,

    -- Constraints
    UNIQUE KEY `users_email_unique` (`email`),
    KEY `users_role_id_index` (`role_id`),
    KEY `users_status_index` (`status`),
    KEY `users_password_set_index` (`password_set`),
    KEY `users_deleted_at_index` (`deleted_at`),
    KEY `users_created_at_index` (`created_at`),

    CONSTRAINT `users_role_id_foreign`
        FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Laravel Migration

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->rememberToken();

    // Password setup for admin-created users
    $table->string('password_setup_token')->nullable();
    $table->timestamp('password_setup_token_expires_at')->nullable();
    $table->boolean('password_set')->default(false);

    // Role
    $table->foreignId('role_id')->nullable()->constrained()->nullOnDelete();

    // Signature
    $table->text('signature_html')->nullable();

    // Status & Tracking
    $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
    $table->timestamp('last_login_at')->nullable();
    $table->string('last_login_ip', 45)->nullable();

    $table->timestamps();
    $table->softDeletes();

    // Indexes
    $table->index('status');
    $table->index('password_set');
    $table->index('created_at');
});
```

---

## 2. PROFILES TABLE

```sql
CREATE TABLE `profiles` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,

    -- Profile Picture
    `avatar_path` VARCHAR(500) NULL DEFAULT NULL,

    -- Company Information
    `company_name` VARCHAR(255) NULL DEFAULT NULL,
    `job_title` VARCHAR(255) NULL DEFAULT NULL,
    `department` VARCHAR(255) NULL DEFAULT NULL,

    -- Contact Details
    `phone` VARCHAR(20) NULL DEFAULT NULL,
    `mobile` VARCHAR(20) NULL DEFAULT NULL,
    `address` TEXT NULL DEFAULT NULL,
    `city` VARCHAR(100) NULL DEFAULT NULL,
    `state` VARCHAR(100) NULL DEFAULT NULL,
    `country` VARCHAR(100) NULL DEFAULT NULL,
    `postal_code` VARCHAR(20) NULL DEFAULT NULL,

    -- Business Information
    `vat_number` VARCHAR(50) NULL DEFAULT NULL,
    `tax_id` VARCHAR(50) NULL DEFAULT NULL,

    -- Preferences
    `timezone` VARCHAR(50) DEFAULT 'UTC',
    `locale` VARCHAR(10) DEFAULT 'en',
    `date_format` VARCHAR(20) DEFAULT 'Y-m-d',

    -- Timestamps
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    -- Constraints
    UNIQUE KEY `profiles_user_id_unique` (`user_id`),

    CONSTRAINT `profiles_user_id_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. ROLES TABLE

```sql
CREATE TABLE `roles` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `is_system` TINYINT(1) NOT NULL DEFAULT 0,
    `level` INT UNSIGNED NOT NULL DEFAULT 0,

    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    UNIQUE KEY `roles_slug_unique` (`slug`),
    KEY `roles_level_index` (`level`),
    KEY `roles_is_system_index` (`is_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. PERMISSIONS TABLE

```sql
CREATE TABLE `permissions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `group` VARCHAR(100) NOT NULL,
    `description` TEXT NULL DEFAULT NULL,

    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    UNIQUE KEY `permissions_slug_unique` (`slug`),
    KEY `permissions_group_index` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. ROLE_PERMISSION PIVOT TABLE

```sql
CREATE TABLE `role_permission` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` BIGINT UNSIGNED NOT NULL,

    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    UNIQUE KEY `role_permission_unique` (`role_id`, `permission_id`),
    KEY `role_permission_permission_id_index` (`permission_id`),

    CONSTRAINT `role_permission_role_foreign`
        FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `role_permission_permission_foreign`
        FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. TWO_FACTOR_CODES TABLE

```sql
CREATE TABLE `two_factor_codes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `type` ENUM('login', 'password_reset', 'email_verification') DEFAULT 'login',
    `expires_at` TIMESTAMP NOT NULL,
    `used_at` TIMESTAMP NULL DEFAULT NULL,
    `ip_address` VARCHAR(45) NULL DEFAULT NULL,
    `user_agent` VARCHAR(500) NULL DEFAULT NULL,

    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    KEY `two_factor_codes_user_id_index` (`user_id`),
    KEY `two_factor_codes_code_index` (`code`),
    KEY `two_factor_codes_expires_at_index` (`expires_at`),
    KEY `two_factor_codes_type_index` (`type`),

    CONSTRAINT `two_factor_codes_user_foreign`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. PASSWORD_RESET_TOKENS TABLE

```sql
CREATE TABLE `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (`email`),
    KEY `password_reset_tokens_token_index` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. PRODUCTS TABLE

```sql
CREATE TABLE `products` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Basic Information
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `sku` VARCHAR(100) NULL DEFAULT NULL,
    `barcode` VARCHAR(100) NULL DEFAULT NULL,
    `description` TEXT NULL DEFAULT NULL,
    `short_description` VARCHAR(500) NULL DEFAULT NULL,

    -- Categorization
    `category` VARCHAR(100) NULL DEFAULT NULL,
    `subcategory` VARCHAR(100) NULL DEFAULT NULL,
    `brand` VARCHAR(100) NULL DEFAULT NULL,
    `tags` JSON NULL DEFAULT NULL,

    -- Pricing
    `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `cost_price` DECIMAL(12, 2) NULL DEFAULT NULL,
    `rental_price_daily` DECIMAL(12, 2) NULL DEFAULT NULL,
    `rental_price_weekly` DECIMAL(12, 2) NULL DEFAULT NULL,
    `rental_price_monthly` DECIMAL(12, 2) NULL DEFAULT NULL,
    `currency` VARCHAR(3) DEFAULT 'USD',

    -- Inventory
    `quantity` INT NOT NULL DEFAULT 0,
    `min_quantity` INT NOT NULL DEFAULT 0,
    `max_quantity` INT NULL DEFAULT NULL,
    `unit` VARCHAR(50) DEFAULT 'piece',

    -- Status
    `status` ENUM('active', 'inactive', 'discontinued') NOT NULL DEFAULT 'active',
    `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
    `is_rentable` TINYINT(1) NOT NULL DEFAULT 1,

    -- Media
    `image_path` VARCHAR(500) NULL DEFAULT NULL,
    `gallery` JSON NULL DEFAULT NULL,

    -- Specifications
    `specifications` JSON NULL DEFAULT NULL,
    `dimensions` JSON NULL DEFAULT NULL,
    `weight` DECIMAL(10, 2) NULL DEFAULT NULL,
    `weight_unit` VARCHAR(10) DEFAULT 'kg',

    -- SEO
    `meta_title` VARCHAR(255) NULL DEFAULT NULL,
    `meta_description` VARCHAR(500) NULL DEFAULT NULL,

    -- Tracking
    `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
    `updated_by` BIGINT UNSIGNED NULL DEFAULT NULL,

    -- Timestamps
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,

    -- Constraints
    UNIQUE KEY `products_slug_unique` (`slug`),
    UNIQUE KEY `products_sku_unique` (`sku`),
    KEY `products_status_index` (`status`),
    KEY `products_category_index` (`category`),
    KEY `products_brand_index` (`brand`),
    KEY `products_is_featured_index` (`is_featured`),
    KEY `products_price_index` (`price`),
    KEY `products_created_at_index` (`created_at`),
    KEY `products_deleted_at_index` (`deleted_at`),

    CONSTRAINT `products_created_by_foreign`
        FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `products_updated_by_foreign`
        FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Full-text search index
ALTER TABLE `products` ADD FULLTEXT INDEX `products_search` (`name`, `description`, `sku`);
```

---

## 9. CLIENTS TABLE

```sql
CREATE TABLE `clients` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Client Type
    `type` ENUM('individual', 'company') NOT NULL DEFAULT 'company',

    -- Basic Information
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL DEFAULT NULL,
    `phone` VARCHAR(20) NULL DEFAULT NULL,
    `mobile` VARCHAR(20) NULL DEFAULT NULL,
    `website` VARCHAR(255) NULL DEFAULT NULL,

    -- Company Details (for type = company)
    `company_name` VARCHAR(255) NULL DEFAULT NULL,
    `trading_name` VARCHAR(255) NULL DEFAULT NULL,
    `registration_number` VARCHAR(100) NULL DEFAULT NULL,
    `vat_number` VARCHAR(50) NULL DEFAULT NULL,
    `tax_id` VARCHAR(50) NULL DEFAULT NULL,

    -- Contact Person
    `contact_person` VARCHAR(255) NULL DEFAULT NULL,
    `contact_position` VARCHAR(100) NULL DEFAULT NULL,
    `contact_email` VARCHAR(255) NULL DEFAULT NULL,
    `contact_phone` VARCHAR(20) NULL DEFAULT NULL,

    -- Address
    `address_line_1` VARCHAR(255) NULL DEFAULT NULL,
    `address_line_2` VARCHAR(255) NULL DEFAULT NULL,
    `city` VARCHAR(100) NULL DEFAULT NULL,
    `state` VARCHAR(100) NULL DEFAULT NULL,
    `postal_code` VARCHAR(20) NULL DEFAULT NULL,
    `country` VARCHAR(100) NULL DEFAULT NULL,

    -- Billing Address (if different)
    `billing_address_same` TINYINT(1) NOT NULL DEFAULT 1,
    `billing_address` JSON NULL DEFAULT NULL,

    -- Financial
    `credit_limit` DECIMAL(12, 2) NULL DEFAULT NULL,
    `payment_terms` INT NULL DEFAULT 30,
    `currency` VARCHAR(3) DEFAULT 'USD',

    -- Status & Classification
    `status` ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
    `classification` ENUM('regular', 'vip', 'wholesale', 'retail') DEFAULT 'regular',
    `source` VARCHAR(100) NULL DEFAULT NULL,

    -- Notes
    `notes` TEXT NULL DEFAULT NULL,
    `internal_notes` TEXT NULL DEFAULT NULL,

    -- Tracking
    `assigned_to` BIGINT UNSIGNED NULL DEFAULT NULL,
    `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,

    -- Timestamps
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,

    -- Constraints
    KEY `clients_type_index` (`type`),
    KEY `clients_status_index` (`status`),
    KEY `clients_classification_index` (`classification`),
    KEY `clients_email_index` (`email`),
    KEY `clients_company_name_index` (`company_name`),
    KEY `clients_assigned_to_index` (`assigned_to`),
    KEY `clients_created_at_index` (`created_at`),
    KEY `clients_deleted_at_index` (`deleted_at`),

    CONSTRAINT `clients_assigned_to_foreign`
        FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `clients_created_by_foreign`
        FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Full-text search index
ALTER TABLE `clients` ADD FULLTEXT INDEX `clients_search` (`name`, `company_name`, `email`, `contact_person`);
```

---

## 10. ACTIVITY_LOGS TABLE

```sql
CREATE TABLE `activity_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Log Type
    `log_name` VARCHAR(100) NOT NULL DEFAULT 'default',
    `event` VARCHAR(100) NOT NULL,

    -- Description
    `description` TEXT NOT NULL,

    -- Subject (the entity being acted upon) - Polymorphic
    `subject_type` VARCHAR(255) NULL DEFAULT NULL,
    `subject_id` BIGINT UNSIGNED NULL DEFAULT NULL,

    -- Causer (who performed the action) - Polymorphic
    `causer_type` VARCHAR(255) NULL DEFAULT NULL,
    `causer_id` BIGINT UNSIGNED NULL DEFAULT NULL,

    -- Additional Context
    `properties` JSON NULL DEFAULT NULL,
    `changes` JSON NULL DEFAULT NULL,

    -- Module/Section
    `module` VARCHAR(100) NULL DEFAULT NULL,

    -- Request Information
    `ip_address` VARCHAR(45) NULL DEFAULT NULL,
    `user_agent` VARCHAR(500) NULL DEFAULT NULL,
    `url` VARCHAR(500) NULL DEFAULT NULL,
    `method` VARCHAR(10) NULL DEFAULT NULL,

    -- Timestamps
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    -- Indexes
    KEY `activity_logs_log_name_index` (`log_name`),
    KEY `activity_logs_event_index` (`event`),
    KEY `activity_logs_subject_index` (`subject_type`, `subject_id`),
    KEY `activity_logs_causer_index` (`causer_type`, `causer_id`),
    KEY `activity_logs_module_index` (`module`),
    KEY `activity_logs_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 11. SESSIONS TABLE

```sql
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `ip_address` VARCHAR(45) NULL DEFAULT NULL,
    `user_agent` TEXT NULL DEFAULT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,

    PRIMARY KEY (`id`),
    KEY `sessions_user_id_index` (`user_id`),
    KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 12. CACHE TABLE

```sql
CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` INT NOT NULL,

    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` INT NOT NULL,

    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 13. JOBS TABLE (Queue)

```sql
CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL,
    `reserved_at` INT UNSIGNED NULL DEFAULT NULL,
    `available_at` INT UNSIGNED NOT NULL,
    `created_at` INT UNSIGNED NOT NULL,

    KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Relationships Summary

| Model | Relationship | Related Model | Type |
|-------|--------------|---------------|------|
| User | belongsTo | Role | N:1 |
| User | hasOne | Profile | 1:1 |
| User | hasMany | TwoFactorCode | 1:N |
| User | hasMany | ActivityLog (as causer) | 1:N (polymorphic) |
| Role | hasMany | User | 1:N |
| Role | belongsToMany | Permission | N:N |
| Permission | belongsToMany | Role | N:N |
| Product | hasMany | ActivityLog (as subject) | 1:N (polymorphic) |
| Product | belongsTo | User (created_by) | N:1 |
| Client | hasMany | ActivityLog (as subject) | 1:N (polymorphic) |
| Client | belongsTo | User (assigned_to) | N:1 |
| ActivityLog | morphTo | Subject | Polymorphic |
| ActivityLog | morphTo | Causer | Polymorphic |

---

## Index Optimization Notes

1. **Composite Indexes**: Added for common query patterns
2. **Full-Text Search**: Enabled on products and clients for search functionality
3. **Soft Deletes**: All main tables support soft deletes with indexed `deleted_at`
4. **Foreign Keys**: Proper cascade/set null on delete relationships
5. **JSON Columns**: Used for flexible data (tags, specifications, gallery)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Database:** MySQL 8.0+ (InnoDB)
