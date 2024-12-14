'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // TODO: Implement signup logic
    console.log('Signup attempt:', { username, password });
    alert('Registration successful! Redirecting to chat...');
    window.location.href = "/chat";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-[400px] w-full p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Sign up for PapaChat
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            required
            className="w-full px-3 py-2 mb-4 text-sm border border-gray-300 rounded-md bg-white"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            required
            className="w-full px-3 py-2 mb-4 text-sm border border-gray-300 rounded-md bg-white"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            required
            className="w-full px-3 py-2 mb-4 text-sm border border-gray-300 rounded-md bg-white"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button 
            type="submit" 
            className="w-full px-4 py-2 mb-4 text-sm text-white bg-blue-600 border-none rounded-md cursor-pointer"
          >
            Sign up
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 no-underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}