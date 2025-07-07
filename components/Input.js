export default function Input({ inputType = "", placeholderText, value, onChange }) {
  return (
    <input className="dark:bg-slate-800 dark:text-slate-200 w-full max-w-[400px] mx-auto px-4 py-2 sm:py-3 border-2 border-solid border-indigo-400 dark:border-indigo-500 rounded-full outline-none hover:border-indigo-600 duration-200 transition focus:border-indigo-600 focus:border-2 placeholder:font-sans" placeholder={placeholderText} type={inputType} value={value} onChange={onChange} />
  )
}
