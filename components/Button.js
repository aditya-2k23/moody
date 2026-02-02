"use client";

/**
 * Blob Button Component
 * A beautiful animated button with a gooey blob effect on hover.
 * 
 * Props:
 * - text: Button text content (can be string or JSX)
 * - dark: If true, renders a filled indigo button with opacity hover (NO blob animation)
 * - full: If true, button takes full width
 * - onClick: Click handler function
 * - normal: If false, renders a raw button without ANY styling (only className applies)
 * - className: Additional CSS classes
 * - size: 'sm' | 'default' | 'lg' for button size variants (only applies to blob buttons)
 * - disabled: If true, button is disabled
 * 
 * Rendering Priority:
 * 1. If normal=false → Raw button (no styles, full className control)
 * 2. If dark=true → Filled button (indigo bg, opacity hover, NO blob effect)
 * 3. Otherwise → Default blob animation button
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

  // Prevent onClick when disabled (extra safeguard beyond HTML disabled)
  const handleClick = disabled ? undefined : onClick;

  if (!normal) {
    // Raw button without blob styling
    return (
      <button
        className={`${disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""} ${className}`}
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled}
      >
        <span className="fugaz whitespace-nowrap">{text}</span>
      </button>
    );
  }

  // Dark button - simple filled button with opacity hover (no blob effect)
  if (dark) {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled}
        className={`
          relative px-6 py-3 rounded-full font-semibold text-white
          bg-indigo-500 dark:bg-indigo-600
          border-2 border-indigo-600 dark:border-indigo-500
          transition-all duration-200
          hover:opacity-80 dark:hover:opacity-70
          ${full ? "w-full grid place-items-center" : ""}
          ${disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}
          ${className}
        `}
      >
        <span className="fugaz whitespace-nowrap">{text}</span>
      </button>
    );
  }

  // Default button with blob effect
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`blob-btn ${full ? "blob-btn--full" : ""} ${sizeClass} ${disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : ""} ${className}`}
    >
      <span className="fugaz whitespace-nowrap relative z-10">{text}</span>

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
