# Release Notes: v2.5.3 (2026-03-14)

Welcome to Moody v2.5.3! This release focuses heavily on performance improvements, specifically targeting Docker containerization, build speeds, and continuous integration workflows.

## ⚡ Performance Upgrades

*   **Massive Docker Image Reduction:**
    *   We've shrunk our production image size from a bulky **1.07 GB** down to a lean **288.71 MB**!
    *   This was achieved by switching the runtime to **distroless Node 20**, resulting in a significantly smaller and more secure container.
*   **Faster Container Builds:**
    *   Migrated the Docker build process to a multi-stage setup utilizing the Next.js standalone output.
    *   Introduced BuildKit cache mounts for both npm and the Next.js build cache, drastically speeding up subsequent builds.
    *   Disabled Next.js telemetry in the builder (`NEXT_TELEMETRY_DISABLED=1`) to eliminate unnecessary overhead.
*   **Enhanced Build Resilience:**
    *   Added build-safe Firebase public configuration fallbacks. This prevents prerender failures in containerized environments when client environment variables aren't injected during the image build phase.

## 🔧 Workflow Improvements

*   **Docker Workflow Simplification:**
    *   Removed Firebase public build arguments from the Docker build path, ensuring images remain strictly environment-agnostic.
    *   Introduced a new conditional Next.js build validation toggle (`SKIP_NEXT_VALIDATION`) to allow for even faster Docker builds when needed.
*   **Dependency Cleanup:**
    *   Removed the unused `use-local-storage-state` dependency to keep the codebase clean and efficient.

## 🐳 Developer Experience (DX)

*   **Ready-to-Use Docker Compose:**
    *   We've added a comprehensive `docker-compose.yml` file, making onboarding a breeze for contributors.
    *   Simply run `docker compose up --build` to spin up the entire application locally!
    *   It includes sensible defaults, built-in port mapping (`3000:3000`), and streamlined environment wiring.

## 🤖 CI/CD Optimizations

*   **Docker GitHub Actions Workflow Overhaul:**
    *   Fully migrated to `docker/build-push-action@v5`, leveraging Buildx caching for maximum efficiency.
    *   Implemented cache scopes to improve reuse across multiple workflow runs.
    *   Added `concurrency` cancellation to automatically stop redundant in-progress builds, saving CI minutes.
    *   Configured `paths-ignore` so docs-only changes no longer trigger full builds.
    *   Pinned the build platform to `linux/amd64` for consistency.
    *   Disabled provenance/SBOM generation to reduce push overhead and speed up deployments.

## 📚 Documentation Updates

*   **Refined Docker Guidelines:**
    *   Updated the Docker documentation in both `README.md` and `CONTRIBUTING.md`.
    *   Promoted the new Docker Compose setup as the officially recommended workflow for contributors.
    *   Clarified the distinction between Docker log hostname behavior (`<container-id>:3000`) and the standard host access URL (`localhost:3000`).
