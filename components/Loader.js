import { LoaderCircle } from "lucide-react";

const sizeClasses = {
  "xs": "text-base sm:text-xs",
  "base": "text-lg sm:text-base",
  "sm": "text-xl sm:text-sm",
  "md": "text-2xl sm:text-md",
  "lg": "text-3xl sm:text-lg",
  "xl": "text-4xl sm:text-xl",
  "2xl": "text-5xl sm:text-2xl",
  "3xl": "text-6xl sm:text-3xl",
  "4xl": "text-7xl sm:text-4xl",
  "5xl": "text-8xl sm:text-5xl",
};

export default function Loader({ size = "5xl" }) {
  const sizeClass = sizeClasses[size] || sizeClasses["5xl"];

  return (
    <div className="flex flex-col flex-1 justify-center items-center gap-4">
      <LoaderCircle
        className={`animate-spin text-indigo-600 dark:text-indigo-400 ${sizeClass}`}
      />
    </div>
  );
}
