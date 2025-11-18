"use client";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const identifier = form.identifier.value;
    const password = form.password.value;

    await signIn("credentials", {
      identifier,
      password,
      redirect: true,
      callbackUrl: "/",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-4 p-6 bg-gray-100 rounded-md"
      >
        <input
          name="identifier"
          type="text"
          placeholder="Username or Email"
          className="p-2 border rounded"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="p-2 border rounded"
          required
        />
        <button type="submit" className="p-2 bg-blue-600 text-white rounded">
          Sign In
        </button>
      </form>
    </div>
  );
}
