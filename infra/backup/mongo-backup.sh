#!/usr/bin/env bash
# ─── Dragon Ecosystem — MongoDB Backup Script ─────────────────────────────────
#
# Usage (run from the VPS, not inside the Docker container):
#   MONGODB_URI="mongodb://user:pass@host:27017/db?authSource=admin" \
#   bash infra/backup/mongo-backup.sh
#
# Required env vars:
#   MONGODB_URI          — MongoDB connection string (or BACKUP_MONGODB_URI for
#                          a dedicated read-only backup account)
#
# Optional env vars:
#   BACKUP_TEMP_DIR      — local staging dir (default: /tmp/dragon-backups)
#   STORAGE_PROVIDER     — arvan | minio | local (default: local)
#   BACKUP_STORAGE_BUCKET_PREFIX — object key prefix (default: backups/mongodb)
#
# S3-compatible upload env vars (required when STORAGE_PROVIDER=arvan|minio):
#   STORAGE_S3_ENDPOINT
#   STORAGE_S3_REGION
#   STORAGE_S3_ACCESS_KEY_ID
#   STORAGE_S3_SECRET_ACCESS_KEY
#   STORAGE_BUCKET
#
# Security notes:
#   - This script never prints credentials to stdout or stderr.
#   - The MONGODB_URI is passed to mongodump via --uri flag, not via shell
#     string interpolation where possible.
#   - Temp files are cleaned up after a successful upload.
#   - Never commit backup output files. Add /tmp/dragon-backups/ to .gitignore.
#
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

MONGO_URI="${BACKUP_MONGODB_URI:-${MONGODB_URI:-}}"
if [[ -z "${MONGO_URI}" ]]; then
  echo "[ERROR] MONGODB_URI or BACKUP_MONGODB_URI must be set." >&2
  exit 1
fi

TEMP_DIR="${BACKUP_TEMP_DIR:-/tmp/dragon-backups}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
BACKUP_SUBDIR="mongo-${TIMESTAMP}"
BACKUP_PATH="${TEMP_DIR}/${BACKUP_SUBDIR}"
TAR_PATH="${BACKUP_PATH}.tar.gz"

PROVIDER="${STORAGE_PROVIDER:-local}"
BUCKET_PREFIX="${BACKUP_STORAGE_BUCKET_PREFIX:-backups/mongodb}"

# ── Preparation ───────────────────────────────────────────────────────────────

mkdir -p "${BACKUP_PATH}"
echo "[INFO] Backup staging directory: ${BACKUP_PATH}"

# ── Run mongodump ──────────────────────────────────────────────────────────────

echo "[INFO] Starting mongodump at ${TIMESTAMP}"

# --uri is passed as a variable to avoid shell string interpolation risks.
# mongodump reads the URI securely; we do not echo it.
mongodump --uri="${MONGO_URI}" --out="${BACKUP_PATH}" --quiet

echo "[INFO] mongodump completed."

# ── Compress ──────────────────────────────────────────────────────────────────

echo "[INFO] Compressing backup to ${TAR_PATH}"
tar -czf "${TAR_PATH}" -C "${TEMP_DIR}" "${BACKUP_SUBDIR}"
SIZE_BYTES="$(stat -c%s "${TAR_PATH}" 2>/dev/null || stat -f%z "${TAR_PATH}")"
echo "[INFO] Compressed size: ${SIZE_BYTES} bytes"

# ── Upload to Object Storage ──────────────────────────────────────────────────

if [[ "${PROVIDER}" == "arvan" || "${PROVIDER}" == "minio" ]]; then
  if [[ -z "${STORAGE_S3_ENDPOINT:-}" || -z "${STORAGE_S3_ACCESS_KEY_ID:-}" ]]; then
    echo "[ERROR] STORAGE_S3_ENDPOINT and STORAGE_S3_ACCESS_KEY_ID must be set for S3 upload." >&2
    exit 1
  fi
  if [[ -z "${STORAGE_BUCKET:-}" ]]; then
    echo "[ERROR] STORAGE_BUCKET must be set for S3 upload." >&2
    exit 1
  fi

  OBJECT_KEY="${BUCKET_PREFIX}/${TIMESTAMP}.tar.gz"
  echo "[INFO] Uploading to s3://${STORAGE_BUCKET}/${OBJECT_KEY}"

  # Use AWS CLI for upload. Credentials are supplied via env vars (not printed).
  AWS_ACCESS_KEY_ID="${STORAGE_S3_ACCESS_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${STORAGE_S3_SECRET_ACCESS_KEY}" \
  AWS_DEFAULT_REGION="${STORAGE_S3_REGION:-ir-thr-at1}" \
    aws s3 cp "${TAR_PATH}" \
      "s3://${STORAGE_BUCKET}/${OBJECT_KEY}" \
      --endpoint-url "${STORAGE_S3_ENDPOINT}" \
      --no-progress \
      --quiet

  echo "[INFO] Upload complete: s3://${STORAGE_BUCKET}/${OBJECT_KEY}"

  # Clean up local temp files after successful upload.
  rm -rf "${BACKUP_PATH}" "${TAR_PATH}"
  echo "[INFO] Local temp files removed."
else
  echo "[INFO] STORAGE_PROVIDER=${PROVIDER}: backup artifact kept locally at ${TAR_PATH}."
  echo "[WARN] For production, use STORAGE_PROVIDER=arvan or minio to upload off-server."
  rm -rf "${BACKUP_PATH}"
fi

# ── Summary ───────────────────────────────────────────────────────────────────

echo "[INFO] Backup completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[INFO] SIZE_BYTES=${SIZE_BYTES}"
if [[ "${PROVIDER}" == "arvan" || "${PROVIDER}" == "minio" ]]; then
  echo "[INFO] OBJECT_KEY=${OBJECT_KEY:-}"
fi
