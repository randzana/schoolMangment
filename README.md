# School Administration & Financial Management System

A production-grade, full-stack School Administration and Financial Management System built with **Laravel 11**, **Next.js 15 (App Router)**, and **PostgreSQL 16**.

---

## Features

- **Authentication:** Token-based security via Laravel Sanctum & Role-Based Access Control (`admin` vs `user`).
- **Student Information:** Registration profiles, grade mapping, autocomplete typeahead, and full financial history audits.
- **Tuition & Meal Tracking:** Dynamic balance calculators, discount management, overpayment prevention, and transaction-safe global invoice numbering.
- **Clothes & Books:** Store purchases tracking.
- **Expenses & Salary:** Operations disbursements ledger and teacher monthly salary payroll sheets.
- **Audits & Reports:** 6 pre-configured analytical report grids with instant PDF streams and CSV tables generation.
- **Returned Bills:** Administrative logs for returned, voided, or refunded transactions.

---

## Tech Stack

- **Backend:** Laravel 11, Barryvdh Laravel DomPDF (A5 Invoice Templates).
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4 inline styles, Zustand state store, React Query server caching, React Hook Form + Zod.
- **Database:** PostgreSQL 16.

---

## Installation & Setup

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 20.9+ & npm
- PostgreSQL 16 database running

### 1. Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Install Composer packages
composer install

# Configure your PostgreSQL credentials in .env
# DB_DATABASE=school_admin
# DB_USERNAME=postgres
# DB_PASSWORD=secret

# Run migrations and seed demo accounts / students / payments
php artisan migrate:fresh --seed

# Start Laravel development server
php artisan serve
```

*Demo accounts seeded:*
- **Admin Operator:** `admin` / `admin123`
- **Standard User:** `user1` / `user123`

---

### 2. Frontend Setup

```bash
cd frontend

# Copy environment template
cp .env.example .env.local

# Install node dependencies
npm install

# Start Next.js development server
npm run dev
```

The frontend will run at `http://localhost:3000`. Open it, login with `admin` / `admin123`, and explore the dashboard!
