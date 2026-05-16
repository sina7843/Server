# ADR 0004 — S3-Compatible Storage

## Status

Accepted / Locked by HQ

## Context

Dragon Ecosystem needs a future storage direction that can work with S3-compatible object storage.

## Decision

S3-compatible storage is a locked future storage direction.

## Scope in Slice 0.1

Local MinIO exists only as local infrastructure in Slice 0.1. No media feature, bucket bootstrap, upload flow, or storage client exists in Slice 0.1.

## Not implemented yet

Media and storage implementation comes in later slices. This ADR does not define buckets, upload flows, object policies, media processing, or storage client behavior.
