import Button from "./Button";
import Input from "./Input";

export default function Login() {
  return (
    <div className='flex flex-col flex-1 justify-center items-center gap-4'>
      <h3 className="text-4xl sm:text-5xl md:text-6xl fugaz">Login / Register</h3>
      <p>You&apos;re just one step away</p>

      <Input inputType="email" placeholderText="Email" />
      <Input inputType="password" placeholderText="Password" />

      <div className="max-w-[400px] w-full mx-auto"><Button text="Submit" full /></div>
      <p className="text-center">Don&apos;t have an account? <span className="text-indigo-600">Sign Up</span></p>
    </div>
  )
}
