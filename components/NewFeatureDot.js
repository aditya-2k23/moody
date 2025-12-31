/**
 * NewFeatureDot - A small red indicator dot to highlight new features
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes for positioning
 */
export default function NewFeatureDot({ className = "" }) {
  return (
    <span
      className={`w-2 h-2 bg-red-500 rounded-full ${className}`}
      aria-label="New feature"
    />
  );
}
