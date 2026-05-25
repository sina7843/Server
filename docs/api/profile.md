# Profile API

---

## Own profile

### GET `/api/v1/me/profile` — Bearer required

Returns the authenticated user's own profile.

**Response `200`:**

```json
{
  "id": "<userId>",
  "username": "john_doe",
  "displayName": "John Doe",
  "bio": "...",
  "avatarUrl": "https://...",
  "isPublic": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH `/api/v1/me/profile` — Bearer required

Updates the authenticated user's own profile fields.

**Request body (all fields optional):**

```json
{
  "displayName": "John Doe",
  "bio": "...",
  "isPublic": true
}
```

Username changes are subject to availability and format validation. Not all fields are mutable in Phase 0 — see limitations below.

**Response `200`:** Updated profile object (same shape as GET).

**Errors:** `400` validation failure · `409` username already taken

---

## Avatar

### POST `/api/v1/me/avatar` — Bearer required

Sets the profile avatar to an existing media asset already in the library.

**Request body:**

```json
{ "mediaId": "<mediaAssetId>" }
```

**Response `200`:** Updated profile object.

**Errors:** `400` invalid mediaId · `404` media asset not found or not owned

---

### POST `/api/v1/me/avatar/upload` — Bearer required

Uploads a new image and sets it as the avatar in one step.

**Request:** `multipart/form-data` with a `file` field (image/jpeg, image/png, image/webp).

**Response `200`:** Updated profile object.

**Errors:** `400` unsupported MIME type or extension · `413` file too large

---

### DELETE `/api/v1/me/avatar` — Bearer required

Removes the current avatar. Does not delete the underlying media asset.

**Response `200`:** Updated profile object with `avatarUrl: null`.

---

## Public profile

### GET `/api/v1/u/:username` — No auth required

Returns the public-facing profile of a user by username.

**Response `200`:**

```json
{
  "username": "john_doe",
  "displayName": "John Doe",
  "bio": "...",
  "avatarUrl": "https://...",
  "joinedAt": "2024-01-01T00:00:00.000Z"
}
```

Returns `404` in all of the following cases (no distinction surfaced):

- Username not found
- Account is private (`isPublic: false`)
- Account is banned or suspended
- Account is soft-deleted

---

## Known limitations (Phase 0)

- No social graph: no follow/unfollow, no follower count, no feed.
- No profile customization marketplace or theme selection.
- No public content feed on profile page (content is navigated directly by type).
- Avatar upload resizes via Sharp but does not generate multiple variant sizes beyond what the media pipeline supports.
- Username validation enforces alphanumeric + underscore, 3–30 chars, lowercase.
- Profile fields are minimal; extended profile fields are Phase 1.
