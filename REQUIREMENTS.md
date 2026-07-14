# Arnold Irrigation District — Management System
## Project Requirements & Value Proposition

**Prepared for:** Arnold Irrigation District Board & Stakeholders  
**Date:** July 2025  
**Document Type:** Reverse-Engineered Requirements + Roadmap

---

## Executive Summary

Arnold Irrigation District has been serving the community since 1906. Managing water rights, patron accounts, assessments, and infrastructure across a large service area has historically relied on paper records, spreadsheets, and siloed tools. This document outlines the modern digital management system we have built and deployed — capturing what has been delivered, the technology choices that make it sustainable, and the roadmap for what comes next.

The system is live, running in the cloud, and iterating rapidly using AI-assisted development. Every feature described in the **Delivered** sections below is functional code running today.

---

## Technology Stack

### Why This Stack?

The choices made here are not arbitrary. Each layer was selected to maximize long-term value, minimize operational cost, and — critically — allow AI-assisted tools like Claude to iterate on the codebase at a pace that would be impossible with legacy frameworks.

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (React 18) | Full-stack, server-rendered, SEO-friendly; one codebase for admin portal and public site |
| **Styling** | Tailwind CSS | Utility-first CSS that AI models can generate reliably and consistently without fighting framework conventions |
| **Database ORM** | Prisma 5 | Type-safe schema with auto-generated migrations; the `schema.prisma` file is the single source of truth for the entire data model |
| **Database** | PostgreSQL (AWS RDS) | Battle-tested relational database; handles water rights, financial records, and audit trails with ACID guarantees |
| **Authentication** | JWT + bcrypt | Stateless auth with role-based access control (Admin, Staff, Patron) |
| **File Storage** | AWS S3 | Scalable document storage for patron documents, compliance records, and legal files |
| **Deployment** | AWS Amplify | Git-push-to-deploy CI/CD pipeline; every commit to `main` triggers an automatic production deployment in 2–5 minutes |
| **Testing** | Playwright | End-to-end browser tests that catch regressions before they reach production |
| **AI Development** | Claude (Anthropic) | Embedded into the development workflow — not a future consideration, an active participant today |

### The AI Development Advantage

Traditional software projects accumulate "technical debt" — shortcuts and workarounds that make the code harder and more expensive to change over time. By building with a clean, typed schema (Prisma), a structured framework (Next.js), and consistent styling (Tailwind), we have created a codebase that Claude can read, understand, and extend with high confidence.

**What this means in practice:**
- New features that would take a traditional developer 2–3 days can be scoped, implemented, and tested in hours
- The entire data model is defined in a single `schema.prisma` file — Claude reads it and immediately understands every relationship in the system
- API endpoints follow a consistent pattern, so adding a new one is a matter of describing the need in plain English
- Existing Playwright tests catch regressions automatically, so iteration speed does not come at the cost of stability

> **The customer owns this advantage.** The AI does not lock you into a proprietary platform — it accelerates development on infrastructure you control.

---

## Delivered Features

### 1. Public-Facing Website

**Status:** ✅ Delivered

The public website serves as the community-facing front door for Arnold Irrigation District.

- **Hero landing page** with district branding, tagline, and patron login/registration calls to action
- **CMS-managed content pages** — staff can create, edit, and publish pages (news, notices, operations updates) without touching code
- **Dynamic navigation** — the site's navigation menus are managed from the admin portal, not hardcoded; staff can add, reorder, and remove links at any time
- **Public alerts and notices** section for irrigation updates and infrastructure announcements
- **Responsive design** — works on desktop, tablet, and mobile

---

### 2. Authentication & User Management

**Status:** ✅ Delivered

A secure, role-based authentication system governs access to every part of the platform.

- **Three role tiers:** Admin, Staff, Patron — each with appropriate access controls
- **JWT-based sessions** with 7-day expiry; no server-side session storage required
- **Password hashing** using bcrypt (industry-standard, HIPAA/compliance-grade)
- **Password reset flow** with time-limited tokens
- **Email verification** tracking per account
- **Patron self-registration** with admin review capability
- **User management interface** — admins can create, edit, activate, and deactivate staff and patron accounts

---

### 3. Patron Account Management

**Status:** ✅ Delivered

The patron record is the central object of the entire system. Every financial, operational, and compliance record links back to a patron account.

- **Comprehensive patron profiles:** account number, legal name, service address, mailing address, contact information
- **Water rights data:** total water right acres, assessed acres — stored and linked to financial calculations
- **Active/inactive status** management
- **Account notes** — timestamped internal notes attached to patron records, visible only to staff and admin
- **Additional contacts** — spouses, caretakers, and secondary contacts with type classification (Spouse, Caretaker, Additional Contact)
- **Document management** — attach and categorize files (Info, Compliance, Legal) to patron records; files stored securely in AWS S3 with download links
- **Turnout associations** — each patron's water delivery points (turnouts) are linked directly to their account
- **Transaction history** — water right transfers and allocation changes are tracked and visible per patron
- **Invoice history** — all assessments issued to a patron are accessible from their account record
- **Saved list views** — staff can create, save, and share custom column layouts and filter combinations for the patron list; a default view can be pinned per user

---

### 4. Turnout Management

**Status:** ✅ Delivered

Turnouts are the physical water delivery points on canals. The system tracks every turnout in the district.

- **Full turnout records:** canal, gate identifier, use type, delivered acres, acres owned, tax lot number, legal description
- **Patron linkage** — each turnout is tied to a patron account number
- **Turnout-level notes** — operational notes can be attached directly to a turnout record (separate from patron-level notes)
- **List and detail views** with search and sort capability
- **Saved list views** — same customizable column/filter system as patron management

---

### 5. Weir Book Management

**Status:** ✅ Delivered

Weir books are a legal and operational record of water measurement points on canals. This is specialized functionality unique to irrigation districts.

- **Weir records** with canal, weir number, and location data
- **Weir book items** — individual entries within a weir book, including acres, private acres, description, notes, and optional images
- **Patron linkage** — weir book items can be associated with patron accounts by account number
- **Image attachment** — photos of weir installations can be stored and displayed
- **Print view** — a formatted, print-ready weir book report

---

### 6. Water Right Transactions

**Status:** ✅ Delivered

Water rights are a legal asset that can be transferred, cancelled, or activated. The system maintains a complete, auditable transaction ledger.

- **Transaction records** with unique transaction numbers
- **Transaction types:** Active, Cancel, Transfer
- **Transfer tracking** — for transfers, both the source and destination patron accounts are recorded
- **Parcel data:** parcel number, legal description, tax lot, subdivision
- **Water right acres** per transaction item
- **Memo field** for transaction notes
- **Date tracking** per transaction

---

### 7. Rates & Assessment Management

**Status:** ✅ Delivered

The billing system supports the district's annual assessment cycle with full rate configuration and invoice generation.

- **Rate types** — named, sortable categories (e.g., "Canal Maintenance", "Water Delivery") that define what is billed
- **Annual rate tables** — rates are configured per year, allowing historical lookups and year-over-year comparison
- **Charge types:** Per Tax Lot, Per Acre of Water, Per Season — the system supports the district's actual billing structure
- **Invoice generation** — invoices are created per patron per rate year, with line items calculated from the rate table and the patron's assessed acres and turnout data
- **Invoice statuses:** Draft, Sent, Paid, Void
- **Invoice snapshots** — patron name and address are captured at invoice time, preserving a point-in-time record even if patron data changes later
- **Line item detail** — each invoice line item records the rate code, description, quantity, unit price, and line total

---

### 8. Ticketing System

**Status:** ✅ Delivered

An internal issue-tracking system allows staff to log, track, and resolve operational issues and feature requests.

- **Ticket types:** Feature Request, Bug Fix
- **Status workflow:** New → In Progress → Waiting Approval → Closed
- **Priority levels:** Low, Medium, High
- **Assignment** to specific staff users
- **Ticket notes** — threaded notes on each ticket for communication and status updates
- **Auto-incrementing ticket numbers** for easy reference

---

### 9. Audit Logging

**Status:** ✅ Delivered

Every data change in the system is recorded in an immutable audit log — a critical requirement for a public utility.

- **All create, update, and delete operations** are captured automatically
- **Record-level tracking** — the audit log records which table and which specific record was changed
- **Change diff** — the exact fields changed and their before/after values are stored as JSON
- **User attribution** — every change is linked to the user who made it
- **Timestamp** on every log entry
- **Admin-accessible audit log viewer** with search and filter capability

---

### 10. CMS — Content Management System

**Status:** ✅ Delivered

Non-technical staff can manage the district's public-facing content without developer involvement.

- **Page creation and editing** with a rich-text editor (Tiptap) supporting headings, bold, italic, links, images, and text alignment
- **Draft/Published status** — content can be staged before going live
- **URL slug management** — clean, readable public URLs for each page
- **SEO fields** — meta title and meta description per page
- **Version attribution** — tracks who created and last updated each page

---

### 11. Navigation Management

**Status:** ✅ Delivered

The public website's navigation is fully managed from the admin portal.

- **Navigation groups** — top-level menu categories with sort ordering
- **Navigation links** — individual links within groups, with label, URL, sort order, and open-in-new-tab option
- **Drag-and-drop-style reordering** via sort order fields
- **Live preview** — changes reflect on the public site immediately after saving

---

## Infrastructure & Operations

### Cloud Deployment

The application runs entirely on AWS infrastructure:

- **AWS Amplify** — hosts the Next.js application with automatic SSL, CDN distribution, and CI/CD pipeline
- **AWS RDS (PostgreSQL)** — managed relational database with automated backups and point-in-time recovery
- **AWS S3** — document storage with presigned URLs for secure, time-limited file access
- **Automatic deployment** — every git push to the `main` branch triggers a production build and deploy in 2–5 minutes

### Security

- All passwords hashed with bcrypt (12 salt rounds)
- JWT tokens signed with a secret key stored in environment variables, never in code
- All environment secrets managed in AWS Amplify Console, not in source code
- Role-based access control enforced at the API layer on every request
- S3 documents accessed only via presigned URLs — no public bucket access
- Audit log captures every data modification for accountability

### Data Migration

Import scripts have been built and executed for initial data load:

- `import-patrons.ts` — bulk patron account import from legacy CSV exports
- `import-allocations.ts` — water allocation data import
- Weir book historical data imported from legacy reports

---

## Roadmap — Planned Features

The following capabilities are scoped and ready to be built using the same AI-accelerated development workflow.

### Phase 2 — Patron Portal

Allow patrons to log in and self-serve, reducing staff workload:

- View their own account details, turnouts, and water rights
- View and download invoices and payment history
- Submit service requests (converted to tickets)
- Sign up for email and SMS alerts
- Access district notices and important communications

### Phase 3 — Billing & Payments

Close the loop on the financial cycle:

- Online invoice payment (ACH / credit card via Stripe or similar)
- Automated assessment generation for all patrons in a rate year (batch processing)
- Payment reminders via email
- Payment receipts emailed automatically
- Reporting: outstanding balances, payment trends, revenue by rate type

### Phase 4 — Operations & Field Tools

Support field staff and operational workflows:

- Mobile-friendly turnout inspection forms
- Photo capture and upload from mobile devices in the field
- Water delivery scheduling and tracking
- Canal maintenance work order management
- Integration with GIS/mapping data for visual turnout location

### Phase 5 — Reporting & Analytics

Turn data into decisions:

- Dashboard with real-time patron, billing, and operational metrics
- Water rights allocation reports (acres by canal, patron, year)
- Assessment collection reports
- Audit log summary reports for board presentations
- Export to CSV/PDF for any list view in the system

### Phase 6 — Notifications & Communications

Proactive outreach to patrons:

- Email notification system (assessment due, payment received, water advisories)
- SMS/text alert opt-in for emergency notices
- Bulk communication tools for staff to message patron segments
- Automated reminders for overdue invoices

---

## The Development Partnership Model

### How We Work With Claude

Claude (Anthropic's AI) is embedded as an active development partner — not a future aspiration. Here is what that looks like in practice:

1. **Feature scoping in plain English** — A staff member or manager describes a need. Claude reads the existing codebase, understands the data model, and proposes an implementation plan before a single line of code is written.

2. **Code generation with full context** — Because the codebase uses clean, typed patterns (Prisma schema, Next.js API routes, React components), Claude can generate new features that integrate correctly with what already exists.

3. **Immediate testing** — Playwright end-to-end tests can be written by Claude alongside new features, so regressions are caught automatically.

4. **Iteration in hours, not weeks** — The examples above (Patron portal, billing automation, field tools) are not multi-month projects. With AI-accelerated development, each can be scoped, built, reviewed, and deployed in days to weeks.

5. **You describe, we deliver** — The district's staff and board do not need to speak in technical language. The AI translates business requirements into working software.

### Total Cost of Ownership Advantage

| Factor | Traditional Approach | This Approach |
|---|---|---|
| **New feature** | 2–4 weeks, $5,000–$15,000 | 1–5 days, fraction of the cost |
| **Bug fix** | 1–3 days, emergency rates | Hours, same workflow |
| **Staff training** | Custom training per vendor tool | Standard web browser, no special software |
| **Data ownership** | Vendor-locked | 100% owned by the district on AWS |
| **Portability** | Dependent on vendor | Open source stack, any developer can contribute |
| **Infrastructure cost** | Typically bundled/opaque | Pay-as-you-go AWS, transparent billing |

---

## Summary

Arnold Irrigation District now has a modern, cloud-hosted management system that:

- **Replaces paper and spreadsheet workflows** with a structured, auditable database
- **Centralizes patron, water rights, financial, and operational data** in one place
- **Gives staff tools that match their actual workflows** — custom list views, notes, documents, tickets
- **Runs continuously on AWS** with automatic deployments and managed infrastructure
- **Is designed to grow** — every phase of the roadmap builds on the same foundation
- **Accelerates with AI** — the technology choices made today mean that Claude can continue to be an active development partner, delivering new value at a pace and cost that traditional software development cannot match

The district is not buying a product. It is building an asset.

---

*Document maintained in the project repository alongside the application source code.*
