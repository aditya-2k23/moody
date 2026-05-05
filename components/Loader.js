import { LoaderCircle } from "lucide-react";

export default function Loader({ size = '5xl' }) {
  return (
    <div className='flex flex-col flex-1 justify-center items-center gap-4'>
      <LoaderCircle className={`animate-spin text-4xl text-indigo-600 dark:text-indigo-400 sm:text-${size}`} />
    </div>
  )
}
