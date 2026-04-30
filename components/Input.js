export default function Input({ inputType = "", placeholderText, value, onChange }) {
  return (
    <input
      className="dark:bg-slate-900/50 dark:text-slate-200 w-full max-w-[400px] mx-auto px-4 py-2 sm:py-3 rounded-full outline-none duration-200 transition-all ring-1 ring-indigo-500/70 dark:ring-indigo-500/30 focus:ring-indigo-500 focus:shadow-[0_0_15px_rgba(79,70,229,0.4)] dark:focus:shadow-[0_0_20px_rgba(129,140,248,0.5)] placeholder:font-sans"
      placeholder={placeholderText}
      type={inputType}
      value={value}
      onChange={onChange}
    />
  )
}
