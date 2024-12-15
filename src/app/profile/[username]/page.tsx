"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
    username: string;
    email?: string;
    joinDate?: string;
    // Add more profile fields as needed
}

interface ChatMessage {
    classCode: string;
    timestamp: string;
    message: string;
}

export default function ProfilePage({ params }: { params: { username: string } }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
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

    const fetchChatHistory = async () => {
        try {
            const response = await fetch(`/api/profile/${params.username}/history`);
            if (response.ok) {
                const history = await response.json();
                // Parse the combined strings into structured data
                const parsedHistory = history.map((item: string) => {
                    const [classCode, date, time, ...messageParts] = item.split(' ');
                    return {
                        classCode,
                        timestamp: `${date} ${time}`,
                        message: messageParts.join(' ')
                    };
                });
                setChatHistory(parsedHistory);
            }
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchChatHistory();
        }
    }, [params.username]);

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
                        👈 Back to Chat
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

            <div className="border-t pt-4 mt-4">
                <h2 className="text-lg font-semibold mb-4">Chat History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {chatHistory.map((chat, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{chat.classCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chat.timestamp}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{chat.message}</td>
                                </tr>
                            ))}
                            {chatHistory.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No chat history available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 