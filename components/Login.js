"use client";

import { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "@/context/authContext";

export default function Login({ initialRegister = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [authenticating, setAuthenticating] = useState(false);

  const { signUp, signIn, currentUser } = useAuth();

  const handleSubmit = async () => {
    setAuthenticating(true);

    try {
      if (isRegister) {
        console.log("Signing up with a new user!");
        console.log("Email:", email);
        console.log("Password:", password);

        await signUp(email, password);
      } else {
        console.log("Logging in with existing user!");
        await signIn(email, password);
      }
    } catch (error) {
      console.log(`${isRegister ? "Sign Up" : "Sign In"} Error:`, error.message);
      if (!email || !password || password.length < 6) {
        return alert("Please fill in all fields with valid data.");
      }
    } finally {
      setAuthenticating(false);
    }
  }

  return (
    <div className='flex flex-col flex-1 justify-center items-center gap-4 md:gap-5'>
      <h3 className="text-4xl sm:text-5xl md:text-6xl fugaz">{isRegister ? "Register" : "Login"}</h3>
      <p className="font-semibold font-sans">{isRegister ? "Start a new journey!" : "You are just one step away!"}</p>

      <Input value={email} onChange={(e) => {
        setEmail(e.target.value);
      }} inputType="email" placeholderText="Email" />
      <Input value={password} onChange={(e) => {
        setPassword(e.target.value);
      }} inputType="password" placeholderText="Password" />

      <div className="max-w-[400px] w-full mx-auto"><Button onClick={handleSubmit} text={authenticating ? "Submitting..." : "Submit"} full /></div>
      <p className="text-center font-sans">{
        isRegister ? "Already have an account?" : "Don't have an account?"
      } <Button onClick={() => setIsRegister(!isRegister)} className="text-indigo-600" text={isRegister ? "Sign In" : "Sign Up"} normal={false} /></p>
    </div>
  )
}
