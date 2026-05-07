export default function Input({ inputType = "", placeholderText, value, onChange }) {
  return (
    <input
      className="dark:bg-slate-900/50 dark:text-slate-200 w-full max-w-[400px] mx-auto px-4 py-2 sm:py-3 rounded-full outline-none duration-200 transition-all ring-1 ring-indigo-500/70 dark:ring-indigo-500/30 focus-visible:ring-indigo-500 focus-visible:shadow-[0_0_16px_rgba(99,102,241,0.35)] dark:focus-visible:shadow-[0_0_20px_rgba(99,102,241,0.35)] placeholder:font-sans"
      placeholder={placeholderText}
      type={inputType}
      value={value}
      onChange={onChange}
    />
  )
}
