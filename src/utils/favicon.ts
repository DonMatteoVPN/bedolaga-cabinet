/**
 * Favicon helpers.
 *
 * The static fallback in index.html is a neutral monogram so the tab is never
 * left without an icon. Once branding is known we override it with the custom
 * logo (or a brand-letter monogram) via {@link setFavicon}.
 */

/** Point the page favicon at `href`, creating the <link> if needed. */
export function setFavicon(href: string): void {
  if (!href) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

/**
 * Generate a square monogram favicon (SVG data URI) from a brand letter.
 * Used when the deployment has no custom logo, so every page still gets an
 * icon that matches the brand letter instead of the browser's blank default.
 */
export function letterFaviconDataUri(letter: string): string {
  const ch = (letter || 'V').trim().charAt(0).toUpperCase() || 'V';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="#0a0f1a"/>` +
    `<text x="50%" y="50%" font-family="Manrope,Arial,sans-serif" font-size="38" ` +
    `font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${ch}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
