'use client';

import { useState } from 'react';
import Link from 'next/link';

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'white'
};

const formContainerStyle = {
  maxWidth: '400px',
  width: '100%',
  padding: '32px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
};

const titleStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '24px',
  color: 'black'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  marginBottom: '16px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: 'white',
  color: 'black'
};

const buttonStyle = {
  width: '100%',
  padding: '8px 16px',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  marginBottom: '16px'
};

const linkTextStyle = {
  textAlign: 'center',
  fontSize: '14px',
  color: '#4b5563'
};

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'none'
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login attempt:', { username, password });
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h1 style={titleStyle}>Login to PapaChat</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            required
            style={inputStyle}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            required
            style={inputStyle}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>
        
        <p style={linkTextStyle}>
          Don't have an account?{' '}
          <Link href="/signup" style={linkStyle}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}