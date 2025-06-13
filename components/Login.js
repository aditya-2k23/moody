import { Fugaz_One } from "next/font/google";
import Button from "./Button";

const fugaz = Fugaz_One({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Login() {
  return (
    <div className='flex flex-col flex-1 justify-center items-center gap-4'>
      <h3 className={`text-4xl sm:text-5xl md:text-6xl ${fugaz.className}`}>Login / Register</h3>
      <p>You&apos;re just one step away</p>

      <input className="w-full max-w-[400px] mx-auto px-3 py-2 sm:py-3 border border-solid border-indigo-400 rounded-full outline-none hover:border-indigo-600 duration-200 transition focus:border-indigo-600 focus:border-2" placeholder="Email" type="text" />
      <input className="w-full max-w-[400px] mx-auto px-3 py-2 sm:py-3 border border-solid border-indigo-400 rounded-full outline-none hover:border-indigo-600 duration-200 transition focus:border-indigo-600 focus:border-2" type="text" placeholder="Password" />

      <div className="max-w-[400px] w-full mx-auto"><Button text="Submit" full /></div>
      <p className="text-center">Don&apos;t have an account? <span className="text-indigo-600">Sign Up</span></p>
    </div>
  )
}
