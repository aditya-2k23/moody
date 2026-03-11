"use client";

/**
 * Blob Button Component
 * A beautiful animated button with a gooey blob effect on hover.
 * 
 * Props:
 * - text: Button text content (can be string or JSX)
 * - dark: If true, renders a blob button with inverted colors (indigo bg, white blob fill on hover)
 * - full: If true, button takes full width
 * - onClick: Click handler function
 * - normal: If false, renders a raw button without ANY styling (only className applies)
 * - className: Additional CSS classes
 * - size: 'sm' | 'default' | 'lg' for button size variants
 * - disabled: If true, button is disabled
 * 
 * Rendering Priority:
 * 1. If normal=false → Raw button (no styles, full className control)
 * 2. If dark=true → Blob button with inverted colors (purple bg → white fill on hover)
 * 3. Otherwise → Default blob animation button (white bg → purple fill on hover)
 */
export default function Button({
  text,
  dark,
  full,
  onClick,
  normal = true,
  className = "",
  size = "default",
  disabled = false
}) {
  // Size class mapping
  const sizeClass = {
    sm: "blob-btn--sm",
    default: "",
    lg: "blob-btn--lg"
  }[size] || "";

  // Dark variant class for blob button
  const darkClass = dark ? "blob-btn--dark" : "";

  // Prevent onClick when disabled (extra safeguard beyond HTML disabled)
  const handleClick = disabled ? undefined : onClick;

  if (!normal) {
    // Raw button without blob styling
    return (
      <button
        className={`${disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""} ${className}`}
        onClick={handleClick}
        type="button"
        disabled={disabled}
        aria-disabled={disabled}
      >
        <span className="fugaz whitespace-nowrap flex items-center gap-1">{text}</span>
      </button>
    );
  }

  // Default button with blob effect (also handles dark variant)
  return (
    <button
      onClick={handleClick}
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      className={`blob-btn ${darkClass} ${full ? "blob-btn--full" : ""} ${sizeClass} ${disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""} ${className}`}
    >
      <span className="fugaz whitespace-nowrap relative z-10 flex items-center gap-1">{text}</span>

      {/* Inner container for blob animation */}
      <span className="blob-btn__inner">
        <span className="blob-btn__blobs">
          <span className="blob-btn__blob"></span>
          <span className="blob-btn__blob"></span>
          <span className="blob-btn__blob"></span>
          <span className="blob-btn__blob"></span>
        </span>
      </span>
    </button>
  );
}

/**
 * SVG Filter for Gooey Effect
 * This component renders an invisible SVG filter that creates the blob merge effect.
 * Should be included once in the layout or root component.
 */
export function BlobSvgFilter() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in2="goo" in="SourceGraphic" result="mix" />
        </filter>
      </defs>
    </svg>
  );
}
