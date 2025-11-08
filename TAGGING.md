# Image Tagging Policy

Repository: `temaroon/moody`

## Purpose

Keep image tags clear, traceable and automatable.

## Tag format

- Production image: `temaroon/moody:1.2.3` (SemVer)
- Build metadata (optional): `temaroon/moody:1.2.3-gitshaabc123`
- Dev image: `temaroon/moody:dev` (only for local/dev use)
- CI snapshot: `temaroon/moody:sha-<short-sha>`

## Source of truth

- The authoritative version is `package.json` → `version` field for app releases.
- Alternatively use Git tags `v1.2.3` (both are supported by CI workflows).

## Workflow (recommended)

1. Update `package.json` version (or create Git tag `vX.Y.Z`).
2. Push to `main` (or push the tag).
3. CI builds the image, tags it with the SemVer and the commit SHA, and pushes to Docker Hub.

## Rollbacks

- Re-deploy previous tag (e.g., `docker pull temaroon/moody:1.2.2`).

## Cleanup

- Use Docker Hub lifecycle rules or registry cleanup job to remove old tags.
