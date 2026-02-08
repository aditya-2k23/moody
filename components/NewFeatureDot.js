/**
 * NewFeatureDot - A small red indicator dot to highlight new features
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes for positioning
 */
export default function NewFeatureDot({ className = "" }) {
  return (
    <span
      className={`absolute w-2 h-2 bg-red-500 rounded-full z-30 ${className}`}
      aria-label="New feature"
    />
  );
}
