import packageJson from "@/package.json";

/**
 * Extracts the major and minor version numbers from a full semantic version string.
 * @param {string} version - The full version string.
 * @returns {string} The "major.minor" version string.
 */
function toMajorMinor(version) {
	const match = String(version || "").match(/^(\d+)\.(\d+)/);
	if (match) {
		return `${match[1]}.${match[2]}`;
	}

	// Fallback for unexpected formats.
	return String(version || "0.0");
}

// Full semver for developer workflows, docs, and release automation.
export const APP_FULL_VERSION = packageJson.version;

// Backward-compatible alias for any existing imports expecting APP_VERSION.
export const APP_VERSION = APP_FULL_VERSION;

// User-facing version should stay major.minor only.
export const APP_DISPLAY_VERSION = toMajorMinor(APP_FULL_VERSION);
export const APP_RELEASE_TAG = "";
export const APP_VERSION_LABEL = `v${APP_DISPLAY_VERSION}${APP_RELEASE_TAG ? ` (${APP_RELEASE_TAG})` : ""}`;