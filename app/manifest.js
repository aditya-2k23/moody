/**
 * Generates the web application manifest for PWA support.
 *
 * @returns {Object} The web app manifest configuration object.
 */
export default function manifest() {
  return {
    name: "Moody",
    short_name: "Moody",
    description: "Track your mood every day of the year with Lumi chat beta and AI-powered journal insights.",
    start_url: "/?source=pwa",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
