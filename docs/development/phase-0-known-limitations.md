# Phase 0 Known Limitations

These are **accepted Phase 0 boundaries**, not hidden defects. Each limitation is a deliberate scope decision for the foundation phase. Phase 1 and later phases will address them based on product priorities.

---

## Infrastructure and deployment

**Single VPS deployment**
The production stack runs on a single Arvan VPS with Docker Compose. There is no horizontal scaling, no load balancer beyond nginx on the same machine, and no automatic failover. A VPS failure takes down all services simultaneously.

**MongoDB and Redis in Docker containers**
MongoDB and Redis run as containers on the same VPS — not as managed cloud services. Data persistence depends on named Docker volumes on the VPS disk. Disk failure without off-VPS backup recovery can result in data loss.

**No Kubernetes or Terraform**
Orchestration is Docker Compose only. There is no Kubernetes cluster, no Helm charts, no Terraform/Ansible infrastructure-as-code. Horizontal scaling requires a manual migration to a managed orchestration platform.

**No monitoring stack**
There is no Prometheus, Grafana, or Loki deployment. Operational visibility relies on:

- Health endpoints (`/health/live`, `/health/ready`, `/health/dependencies`)
- Admin `/system/health` page
- Structured JSON logs via Docker log driver

No alerting, dashboards, or log aggregation is implemented.

---

## Database and search

**Basic MongoDB text search**
The search layer uses `MongoSearchAdapter` — MongoDB native text indexes. There is no:

- Elasticsearch, Meilisearch, or OpenSearch
- Fuzzy matching or typo tolerance
- Persian/Farsi stemming or morphological analysis
- Field boosting or relevance scoring
- Autocomplete or suggestion
- Faceted search or aggregation-based refinement

Search performance will degrade at large collection sizes without additional index tuning.

**No caching layer for search**
Search results are not cached. Every search request hits MongoDB directly.

---

## Backup and restore

**Manual backup triggering only**
Backups are triggered manually via `POST /admin/v1/system/backups/run` or the shell script `infra/backup/mongo-backup.sh`. There is no automated cron-based backup schedule.

**No backup encryption**
Backup archives (`.tar.gz`) are stored unencrypted in Arvan Object Storage. GPG or cloud-native encryption is required before production use. See [backup-security-checklist.md](../security/backup-security-checklist.md).

**Manual restore only**
There is no restore endpoint, no restore button in the admin UI, and no automated restore pipeline. Restore is performed manually by an authorized operator following [restore-runbook.md](../operations/restore-runbook.md). This is intentional — automated restore is high-risk and requires human gate.

**No backup retention policy**
Old backup archives are not automatically deleted. Storage costs will grow over time without manual cleanup.

**No backup integrity verification**
The backup process does not verify the archive by performing a test restore. Backup integrity is assumed but not validated.

**mongodump only**
Backup uses `mongodump` — a point-in-time snapshot. This is not a continuous replication or streaming backup. The backup represents the state at the moment the dump runs.

---

## Authentication and authorization

**No OAuth / social login / passkeys / 2FA**
Authentication is phone-first OTP with password. There is no:

- Google, GitHub, or other OAuth provider
- Apple Sign In
- Passkey / WebAuthn
- TOTP-based 2FA (e.g. Google Authenticator)
- Email-based auth

**ABAC foundation only**
`scopeType` and `scopeId` fields are scaffolded on the permission schema for future object-level policy. No ABAC evaluation engine is implemented. All access control is flat permission key checks. Dynamic object-level policies (e.g. "user can edit their own posts but not others") are Phase 1+.

---

## Media

**Images only**
The media library handles image types: JPEG, PNG, WebP, GIF. There is no:

- Video upload, transcoding, or streaming pipeline
- Audio file support
- PDF or document management
- Large file resumable upload

**Fixed variant set**
Image variants (thumbnail, medium) are fixed. There is no custom crop size, responsive image pipeline, or user-configurable output format.

**No CDN cache invalidation**
Updating or deleting a media asset does not trigger CDN cache purge. Old URLs may serve stale content until CDN TTL expires.

---

## Analytics

**Lightweight aggregations only**
Analytics are MongoDB aggregations run on the existing collections. There is no:

- Time-series database (InfluxDB, TimescaleDB)
- Event streaming (Kafka, Kinesis)
- BI dashboard (Metabase, Grafana)
- Funnel, cohort, or retention analysis
- Revenue analytics
- Real-time analytics websocket feed

Analytics performance will degrade at large collection sizes.

---

## Notifications

**System-generated notifications only**
The notification log records SMS deliveries triggered by system events (OTP, password reset). There is no:

- Marketing campaign system
- Bulk SMS dispatch API
- Push notification (FCM, APNs)
- In-app notification center or inbox
- Email notification channel

---

## Content

**No scheduled publish**
Content is published immediately when `POST /admin/v1/content/posts/:id/publish` is called. There is no scheduled publish with a future timestamp.

**No approval workflow**
There is no editorial review chain, approval gates, or multi-stage content workflow.

**No multi-author**
Content has a single author/creator. Multiple authorship or contributor attribution is Phase 1+.

**No comment system**

---

## Phase 1 business modules — not implemented

The following modules are entirely absent from Phase 0. No routes, schemas, UIs, or placeholder data exist for them:

- Tournament system
- Shop / e-commerce
- Academy / learning management
- Streaming / live video
- Boardgame / interactive gaming
- Recommendation engine
- Full BI / funnels / cohorts / revenue analytics
- Visual page builder
