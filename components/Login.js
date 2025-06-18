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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-indigo-600 hover:opacity-75 transition"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={0}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <i className="fas fa-eye"></i> : <i className="fas fa-eye-slash"></i>}
        </button>
      </div>

      <div className="max-w-[400px] w-full mx-auto">
        <Button onClick={handleSubmit} text={authenticating ? "Submitting..." : "Submit"} full />
      </div>

      <p className="text-center font-sans">{
        isRegister ? "Already have an account?" : "Don't have an account?"
      } <Button onClick={() => setIsRegister(!isRegister)} className="text-indigo-600" text={isRegister ? "Sign In" : "Sign Up"} normal={false} /></p>
    </div>
  )
}
