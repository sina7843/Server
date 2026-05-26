# Phase 0 Out of Scope / Later List

This document lists everything intentionally excluded from Phase 0. None of these items are partially implemented, hinted at, or planned in Phase 0 code or documentation as implemented.

Items listed here are either Phase 1 scope, Phase 2+ scope, or permanent architectural decisions.

---

## Phase 1 domain modules (not defined, not implemented)

- **Tournament system** — brackets, matchmaking, registration, scheduling
- **Shop / e-commerce** — products, cart, checkout, payments, orders
- **Academy / learning management** — courses, lessons, progress tracking, certificates
- **Streaming / live video** — live broadcast, VOD, transcoding, viewer chat
- **Boardgame / interactive** — game sessions, moves, real-time sync, leaderboards

None of these modules have routes, schemas, controllers, workers, or UI in Phase 0.

---

## Authentication and identity

- **OAuth / social login** — Google, GitHub, Apple, or any OAuth2/OIDC provider
- **Passkey / WebAuthn** — FIDO2 credential registration and assertion
- **TOTP / Google Authenticator / 2FA** — time-based one-time password as a second factor
- **Magic link / email auth** — email-based passwordless login
- **Account deletion / right to erasure** — GDPR user data removal API
- **SSO / SAML** — enterprise identity federation

---

## Authorization

- **Full ABAC policy engine** — dynamic object-level policy evaluation, per-resource ACL, attribute-based policy builder
- **Role hierarchy** — parent/child role inheritance
- **Delegation** — user A temporarily grants permissions to user B
- **Time-scoped permissions** — permissions active only within a time window

Phase 0 has ABAC-ready scaffolding (`scopeType`, `scopeId` on the permission schema) but no evaluation engine.

---

## Search

- **Elasticsearch** — full distributed search cluster
- **Meilisearch** — dedicated search engine with typo tolerance
- **OpenSearch** — AWS-compatible search cluster
- **Persian/Farsi stemming** — morphological analysis for Farsi text
- **Fuzzy matching** — typo-tolerant query expansion
- **Autocomplete / suggestions** — typeahead suggestions API
- **Semantic search / vector search** — embedding-based similarity search
- **Search analytics** — query logging, click-through rate, zero-results tracking

---

## Media and content

- **Video upload and transcoding** — HLS/DASH conversion, thumbnail extraction
- **Video streaming** — adaptive bitrate delivery, CDN origin
- **Audio file support** — podcasts, audio clips
- **PDF / document management** — document preview, text extraction
- **Visual page builder** — drag-and-drop layout editor
- **Resumable / chunked upload** — TUS protocol or multipart resumable upload
- **CDN cache invalidation** — automated purge on update/delete
- **Content scheduling** — publish/archive at a future timestamp
- **Editorial workflow** — approval gates, multi-stage review
- **Content import/export** — bulk import from external CMS, export to JSON/RSS

---

## Analytics and BI

- **Time-series database** — InfluxDB, TimescaleDB, ClickHouse
- **Event streaming** — Kafka, Kinesis, Pulsar
- **BI dashboard** — Metabase, Grafana, Superset, Redash
- **Funnel analysis** — conversion funnel tracking
- **Cohort analysis** — user retention cohorts
- **Revenue analytics** — GMV, ARPU, LTV
- **Real-time analytics** — websocket-based live dashboard
- **A/B testing platform** — feature flags and experiment analysis

---

## Notifications and communications

- **Push notifications** — FCM (Android), APNs (iOS)
- **Email notifications** — transactional email via SendGrid, SES, Mailgun
- **In-app notification center** — user inbox, notification badges
- **Marketing campaign system** — bulk SMS, email campaigns, scheduling
- **Webhook delivery** — outbound webhooks to third-party services

---

## Infrastructure and operations

- **Kubernetes** — container orchestration cluster
- **Terraform / Ansible** — infrastructure-as-code provisioning
- **Prometheus + Grafana** — metrics collection and dashboards
- **Loki** — log aggregation
- **Jaeger / Zipkin** — distributed tracing
- **SIEM** — security information and event management
- **WAF** — web application firewall
- **Automated backup scheduling** — cron-triggered backup jobs
- **Backup encryption** — GPG or cloud-native encryption at rest
- **Backup restore endpoint** — API-driven database restore
- **Restore UI** — admin button to restore a backup
- **Multi-region deployment** — geographically distributed stack
- **Auto-scaling** — horizontal pod/container scaling
- **Blue/green deployment** — zero-downtime deploy strategy
- **Managed database** — MongoDB Atlas, Arvan Managed MongoDB

---

## Recommendation and personalization

- **Recommendation engine** — collaborative filtering, content-based recommendations
- **Personalized feed** — user-specific content ranking
- **User interest graph** — follow, bookmark, like systems
- **Social graph** — follower/following network

---

## Developer tooling (Phase 0 intentionally excluded)

- **OpenAPI / Swagger UI endpoint** — no `/api-docs` route (route index docs are sufficient for Phase 0)
- **Generated SDK** — no auto-generated client SDK from OpenAPI spec
- **GraphQL API** — REST-only in Phase 0
- **Webhooks** — no outbound event webhooks

---

## How to use this list

If a Phase 1 planning session proposes implementing something from this list:

1. Check [phase-0-known-limitations.md](phase-0-known-limitations.md) to confirm the limitation and its rationale.
2. Confirm the Phase 0 foundation is compatible with the proposed Phase 1 approach (schema extensibility, API versioning).
3. Add the item to Phase 1 scope documentation with explicit design decisions — do not backport into Phase 0 code.
