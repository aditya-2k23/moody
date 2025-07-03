export default function Button({ text, dark, full, onClick, normal = true, className = "" }) {
  return (
    normal ? (
      <button onClick={onClick} className={`${dark ? `text-white bg-indigo-500` : `text-indigo-600`} border-2 border-solid border-indigo-600 rounded-full overflow-hidden transition duration-200 hover:opacity-80 px-5 sm:px-6 py-2 sm:py-3 ${full ? "grid place-items-center w-full" : ""} ${className}`}>
        <p className="fugaz whitespace-nowrap">{text}</p>
      </button>
    ) : (
      <button className={`${className}`} onClick={onClick}>
        <p className="fugaz whitespace-nowrap">{text}</p>
      </button>
    )
  )
}
