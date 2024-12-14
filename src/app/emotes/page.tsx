'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Emote {
  name: string;
  url: string;
}

export default function EmotesPage() {
  const [emotes, setEmotes] = useState<Emote[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmotes();
  }, []);

  const fetchEmotes = async () => {
    try {
      const response = await fetch('/api/emotes');
      const data = await response.json();
      setEmotes(data.map((name: string) => ({
        name,
        url: `/api/emotes/${name}`
      })));
    } catch (error) {
      console.error('Failed to fetch emotes:', error);
    }
  };

  const handleEmoteUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadStatus('');

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const name = (formData.get('name') as string).trim();

    if (!file || !name) {
      setUploadStatus('Please provide both a file and name');
      setIsLoading(false);
      return;
    }

    if (!name.match(/^[a-zA-Z0-9_]+$/)) {
      setUploadStatus('Emote name must contain only letters, numbers, and underscores');
      setIsLoading(false);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadStatus('Please upload an image file');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/emotes', {
        method: 'POST',
        body: formData,
      });

      const message = await response.text();
      
      if (response.ok) {
        setUploadStatus(message);
        fetchEmotes();
        (e.target as HTMLFormElement).reset();
      } else {
        setUploadStatus(message || 'Failed to upload emote');
      }
    } catch (error) {
      console.error('Error uploading emote:', error);
      setUploadStatus('Error uploading emote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmote = async (emoteName: string) => {
    if (!confirm(`Are you sure you want to delete the emote "${emoteName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/emotes/${emoteName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchEmotes();
      } else {
        console.error('Failed to delete emote');
      }
    } catch (error) {
      console.error('Error deleting emote:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Emote Manager
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleEmoteUpload} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Emote Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Emote Image
              </label>
              <input
                type="file"
                name="file"
                id="file"
                accept="image/*"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-4 py-2 text-sm text-white rounded-md ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Uploading...' : 'Upload Emote'}
            </button>

            {uploadStatus && (
              <p className={`text-sm ${
                uploadStatus.includes('success') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {uploadStatus}
              </p>
            )}
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {emotes.map((emote) => (
            <div 
              key={emote.name}
              className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col items-center relative group"
            >
              <button
                onClick={() => handleDeleteEmote(emote.name)}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete emote"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <Image
                src={emote.url}
                alt={emote.name}
                width={64}
                height={64}
                className="rounded-md"
              />
              <p className="mt-2 text-sm text-gray-600 text-center">{emote.name}</p>
            </div>
          ))}
        </div>

        {emotes.length === 0 && (
          <p className="text-center text-gray-500 mt-8">No emotes uploaded yet</p>
        )}
      </div>
    </div>
  );
}