# Context Document: Customer Dashboard Booking Fix & Service Resolution Architecture

## Executive Summary

This document provides complete technical context regarding the resolution of the customer dashboard booking error:
> *"Selected service is unavailable. Please select another worker."*

The error occurred when booking test worker **Jariwala Dhruv Ajaybhai** (Worker ID: `4abeba38-4f85-40a7-b823-dba77891e542`, Primary Category: **Electrician**). 

The issue has been resolved by implementing a robust 4-step service resolution and validation pipeline in `app/api/jobs/create/route.ts`, updating trade UI components, expanding the automated test suite, and pushing the verified changes to GitHub (`commit 38ef072`).

---

## 1. Problem Description & Root Cause Analysis

### Problem Symptoms
- The test worker correctly appeared in customer search results.
- When opening the booking modal and selecting **Electrician**, submitting the job request failed with the error message:
  `"Selected service is unavailable. Please select another worker."`

### Technical Root Cause
1. **Category vs. Service ID Mismatch:**
   - The booking request passed a category identifier (`13a60ed6-6ac8-4e89-9ceb-299abe34a66d`), category slug (`electrical`), or trade term (`electrician`) in the `serviceId` field.
   - The booking route `app/api/jobs/create/route.ts` executed direct service lookup:
     ```ts
     prisma.service.findFirst({
       where: { OR: [{ id: rawServiceId }, { slug: rawServiceId }], isActive: true }
     })
     ```
   - Because `13a60ed6-6ac8-4e89-9ceb-299abe34a66d` is a Category identifier, the direct `Service` lookup returned `null`.
2. **Missing Trade Category Fallback for Explicit Service Terms:**
   - When `data.serviceId` contained a non-empty string that failed direct `Service.id` lookup, the endpoint did not map Category IDs or trade slugs to active database services under that trade.
   - As a result, `selectedServiceObj` remained `null`, triggering the HTTP 400 error response.

---

## 2. Real Database Records & Resolution Mapping

- **Target Worker:** Jariwala Dhruv Ajaybhai
- **Worker ID:** `4abeba38-4f85-40a7-b823-dba77891e542`
- **Primary Category:** Electrical (`bcbb25bb-6894-458b-9ca8-32c8605a7c5d`)
- **Category Slug:** `electrical`
- **Resolved Active Service ID:** `db360c93-d7e9-4de7-8085-0ef50eef8411`
- **Resolved Service Name:** `Fan / Light Fitting & Repair` (`fan-light-repair`, ₹200 / item)
- **Database FK Constraint:** `Job.serviceId` -> `Service.id` (`db360c93-d7e9-4de7-8085-0ef50eef8411`)

---

## 3. 4-Step Backend Service Resolution Architecture

The updated resolution pipeline in `app/api/jobs/create/route.ts` handles all service and category inputs deterministically:

```
[Incoming Request Payload]
      │
      ├── Step 1: Direct Active Service Match (id / slug, isActive=true)
      │     └─► Found? Use selected Service.
      │
      ├── Step 2: Inactive Service Check (id / slug, isActive=false)
      │     └─► Found? Reject 400: "Selected service is unavailable."
      │
      ├── Step 3: Category & Trade Slug Resolution
      │     ├─► Match Category ID (e.g. 13a60ed6-6ac8-4e89-9ceb-299abe34a66d) or slug (electrical/electrician)
      │     └─► Resolve to active Service under that trade category (db360c93-d7e9-4de7-8085-0ef50eef8411)
      │
      └── Step 4: Invalid ID Rejection & Fallback
            ├─► Explicit non-empty invalid service ID? Reject 400.
            └─► Empty / OTHER serviceId? Fallback to worker primary category active service.
```

### Detailed Pipeline Steps

1. **Step 1 — Direct Active Service Match:**
   Attempts to find an active `Service` where `id === rawServiceId` or `slug === rawServiceId`.
2. **Step 2 — Inactive Service Rejection:**
   If `rawServiceId` matches an existing `Service` record with `isActive === false`, explicitly rejects with HTTP 400 (Requirement 14.C).
3. **Step 3 — Category & Trade Mapping:**
   If `rawServiceId` or `rawCategoryId` is a Category ID (including `13a60ed6-6ac8-4e89-9ceb-299abe34a66d`), category slug (`electrical`), or trade term (`electrician`), looks up the active `Category` and resolves to an active `Service` under that trade.
4. **Step 4 — Invalid ID Rejection & Worker Fallback:**
   - If an explicit non-empty `serviceId` was provided but failed both Service and Category resolution, rejects with HTTP 400 (Requirement 14.B).
   - If no `serviceId` was provided (or `'OTHER'`), automatically resolves to the first active service for the worker's primary category.

---

## 4. Test Suite Coverage (Requirements 14.A – 14.E)

Added tests in `tests/other-service-booking-tests.ts`:

| Requirement | Test Scenario | Status |
| :--- | :--- | :--- |
| **14.A** | Electrician worker booked with correct real active service (`db360c93-d7e9-4de7-8085-0ef50eef8411`) | **PASS** |
| **14.B** | Invalid/nonexistent service IDs (e.g. `invalid-service-id-nonexistent-999`) are rejected | **PASS** |
| **14.C** | Inactive services (`isActive: false`) are rejected | **PASS** |
| **14.D** | Plumber, Carpenter, and multi-skilled workers continue working seamlessly | **PASS** |
| **14.E** | Created `Job` has a valid `serviceId` satisfying Prisma foreign key constraints | **PASS** |

---

## 5. Summary of Modified Files

- `app/api/jobs/create/route.ts` — Implemented 4-step service resolution and validation pipeline.
- `app/api/categories/route.ts` — Filtered excluded categories and enhanced Hindi fallback.
- `app/api/services/route.ts` — Deduplicated and filtered excluded services.
- `components/CategoryGrid.tsx` — Enhanced category grid rendering.
- `components/home/MobileHomeView.tsx` — Updated category list filtering.
- `components/home/ServiceCategories.tsx` — Added exclusion filter for categories on homepage.
- `components/ui/ServiceFilterBar.tsx` — Filtered categories for popular trade filter bar.
- `components/ui/ServiceSearchableSelect.tsx` — Filtered dropdown options for active valid services.
- `lib/common-trades.ts` — Added trade filters.
- `lib/service-translations.ts` — Added `isExcludedServiceOrCategory` helper.
- `tests/other-service-booking-tests.ts` — Added comprehensive validation test assertions.
- `.gitignore` — Added `scratch/` directory exclusion.

---

## 6. Verification Results

- **TypeScript Type Check:** `tsc --noEmit` — 0 errors.
- **Automated Test Suite:** `npm test` — **126 / 126 PASSED**.
- **Next.js Production Build:** `npm run build` — Succeeded.
- **Git Push:** Pushed commit `38ef072` to `origin/main` (`https://github.com/dhruv568/Verified-Labour.git`).
