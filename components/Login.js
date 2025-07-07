"use client";

import { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "@/context/authContext";
import toast, { Toaster } from "react-hot-toast";

export default function Login({ initialRegister = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [authenticating, setAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signUp, signIn, signInWithGoogle } = useAuth();

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
        toast.success("Successfully logged in!");
      }
    } catch (error) {
      console.log(`${isRegister ? "Sign Up" : "Sign In"} Error:`, error.message);
      if (!email || !password || password.length < 6) {
        toast.error("Please fill in all fields with valid information.");
        return;
      }

      if (!isRegister) {
        toast.error(
          error.message.includes("user-not-found")
            ? "User does not exist."
            : error.message.includes("wrong-password")
              ? "Incorrect password."
              : "Login failed. Please check your email or password."
        );
      }
    } finally {
      setAuthenticating(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthenticating(true);
    try {
      await signInWithGoogle();
      toast.success("Successfully signed in with Google!");
    } catch (error) {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setAuthenticating(false);
    }
  };

  // Listen for Enter key to submit the form
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div
      className='flex flex-col flex-1 justify-center items-center gap-3 md:gap-4'
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <Toaster position="top-center" />

      <h3 className="text-4xl sm:text-5xl md:text-6xl fugaz">{isRegister ? "Register" : "Login"}</h3>
      <p className="font-semibold font-sans">{isRegister ? "Start a new journey!" : "You are just one step away!"}</p>

      <Input
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        inputType="email"
        placeholderText="Email"
      />
      <div className="relative w-full max-w-[400px] mx-auto">
        <Input
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          inputType={showPassword ? "text" : "password"}
          placeholderText="Password"
        />
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-indigo-600 dark:text-indigo-400 hover:opacity-75 transition"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={0}
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <i className="fas fa-eye"></i> : <i className="fas fa-eye-slash"></i>}
        </button>
      </div>

      <div className="w-full max-w-[400px] mx-auto flex flex-col gap-2">
        <Button onClick={handleSubmit} text={authenticating ? "Submitting..." : "Submit"} full />
        <div className="flex items-center justify-center gap-2 text-slate-700 font-semibold">
          OR
        </div>
        <button className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 transition-colors px-4 py-2 rounded-full w-full max-w-[400px] mx-auto border-2 border-indigo-600 dark:border-indigo-500 fugaz hover:opacity-70 duration-150" onClick={handleGoogleSignIn} disabled={authenticating}>
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="25" height="25" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
          </svg>Continue with Google
        </button>
      </div>

      <p className="text-center font-sans">{
        isRegister ? "Already have an account?" : "Don't have an account?"
      } <Button onClick={() => setIsRegister(!isRegister)} className="text-indigo-600 dark:text-indigo-400 hover:opacity-80" text={isRegister ? "Sign In" : "Sign Up"} normal={false} /></p>
    </div>
  )
}
