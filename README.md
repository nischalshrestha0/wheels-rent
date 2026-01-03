# Wheels Rent - Vehicle Rental Platform

A full-stack vehicle rental application built with **Node.js**, **Express**, **MongoDB**, and **React + Vite**.

##  Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

## Features

- **Multi-role authentication** (Admin, Owner, Renter)
- **3 Separate Dashboards:**
  - **Admin Dashboard** - Full platform management, user verification, ban/unban
  - **Owner Dashboard** - Vehicle management, booking approvals
  - **Renter Dashboard** - Browse vehicles, make bookings, track rentals
- **KYC Verification System** (Admin-approved, required for booking/listing vehicles)
- Ban/Unban functionality (Admin)
- Vehicle listing and search
- **Rating & Review System** - Verified reviews from completed bookings
- Booking management with owner approval
- Calendar-based availability checking
- Real-time analytics and reporting
- Payment processing
- Reward points system
- JWT with refresh tokens (15 min access, 7 day refresh)
- Responsive UI with Tailwind CSS

##  KYC Verification System

### Verification Checks
The system checks verification status from **two sources**:

1. **User Model** (`user.verificationStatus` + `user.verified`)
   - Primary source of truth
   - Checked first for all verification requirements
   - Legacy users might be verified here without KYC documents

2. **KYC Model** (`kyc.verificationStatus`)
   - Secondary check (for users who submitted documents)
   - Used for document storage and admin review

### Verification Flow
1. **User Registration**:
   - Users register with role selection (Renter, Owner, Admin)
   - Admins can register themselves (auto-verified)
   - Owners and Renters require admin approval

2. **KYC Document Submission** (Owners and Renters):
   - Submit documents for verification (e.g., ID, license, address proof)
   - Documents stored in the KYC model
   - Initial verification status set to `pending`

3. **Admin Review**:
   - Admins review submitted documents in the dashboard
   - Can approve or reject with reasons
   - Updates `verificationStatus` and `verified` fields in the User model
   - Processed verifications remain visible for audit

4. **User Notification**:
   - Users are notified of verification results
   - Approved users can book/list vehicles
   - Rejected users can reapply after addressing issues

### User Actions
- **Submit KYC Documents**: During registration or later
- **Check Verification Status**: In user profile
- **Update Documents**: Resubmit if rejected
- **Delete Documents**: Remove documents from the system

### Admin Actions
- **Review KYC Documents**: Access from user management
- **Approve/Rejec