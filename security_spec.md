# Security Specification for Project Evaluation Intelligence

## Data Invariants
1. A user can only access their own profile.
2. Only Admins and Analysts can create/edit modules.
3. Estimations belong to the project/module they are based on.
4. Users cannot modify the `role` field in their own profile (identity isolation).
5. All IDs must match '^[a-zA-Z0-9_\\-]+$'.

## The "Dirty Dozen" Payloads (Rejected)
1. Unauthorized profile update (changing role to admin).
2. Creating a module without being signed in.
3. Updating a module by a non-admin/analyst.
4. Estimating a module with negative costs.
5. Injecting 1MB strings into title fields.
6. Spoofing `ownerId` on an estimation.
7. Deleting a module by a non-admin.
8. Listing users by a regular user.
9. Modifying `createdAt` field on an estimation.
10. Creating a module with a system-reserved field like `is_verified` by a client.
11. Reading PII of other users.
12. Bulk reading all modules without authentication.

## Firestore Rules Draft
I will implement rules that handle these cases.
