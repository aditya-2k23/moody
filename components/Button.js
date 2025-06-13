export default function Button({ text, dark, full, onClick }) {
  return (
    <button onClick={onClick} className={`${dark ? `text-white bg-indigo-600` : `text-indigo-600`} border-2 border-solid border-indigo-600 rounded-full overflow-hidden transition duration-200 hover:opacity-60 ${full ? "grid place-items-center w-full" : ""}`}>
      <p className="fugaz px-6 sm:px-10 whitespace-nowrap py-2 sm:py-3">{text}</p>
    </button>
  )
}
