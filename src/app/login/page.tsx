'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login attempt:', { username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-[400px] w-full p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          Login to PapaChat
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            required
            className="w-full px-3 py-2 mb-4 text-sm border border-gray-300 rounded-md bg-white text-black"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            required
            className="w-full px-3 py-2 mb-4 text-sm border border-gray-300 rounded-md bg-white text-black"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full px-4 py-2 mb-4 text-sm text-white bg-blue-600 border-none rounded-md cursor-pointer"
          >
            Login
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 no-underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}