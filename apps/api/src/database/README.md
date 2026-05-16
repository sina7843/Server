# API database foundation

This directory contains the minimal MongoDB connection foundation for the Dragon API app.

Slice 0.2 currently provides only:

- `DatabaseModule` registration for the API app.
- `MONGODB_URI` configuration parsing and validation.
- Unit tests for database configuration parsing.

It does not contain database schemas, Mongoose models, migrations, seed data, Auth logic, sessions, OTP logic, or product feature persistence.

The static `/health` route must not check MongoDB readiness in this task.
