"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
    username: string;
    email?: string;
    joinDate?: string;
    // Add more profile fields as needed
}

export default function ProfilePage({ params }: { params: { username: string } }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const currentUser = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

    useEffect(() => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        // Fetch profile data
        fetchProfile();
    }, [params.username]);

    const fetchProfile = async () => {
        try {
            // TODO: Replace with actual API endpoint
            const response = await fetch(`/api/profile/${params.username}`);
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => router.push('/chat')}
                        className="text-blue-500 hover:text-blue-600"
                    >
                        ← Back to Chat
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl">
                            {params.username[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{params.username}</h1>
                            {profile?.email && (
                                <p className="text-gray-500">{profile.email}</p>
                            )}
                        </div>
                    </div>

                    {/* Add more profile sections as needed */}
                    <div className="border-t pt-4 mt-4">
                        <h2 className="text-lg font-semibold mb-2">Profile Info</h2>
                        <p className="text-gray-600">
                            Member since: {profile?.joinDate || 'Unknown'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 