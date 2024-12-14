"use client";

import { useState, useEffect, useRef } from "react";

interface Class {
  id: string;
  code: string;
  name: string;
  instructor: string;
}

interface Message {
  id: string;
  user: string;
  message: string;
  avatar?: string;
  isRight?: boolean;
}

export default function ChatPage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [newTopic, setNewTopic] = useState("");
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch topics on component mount
  useEffect(() => {
    fetchTopics();
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (selectedTopic) {
      // Clear messages when switching topics
      setMessages([]);
      connectWebSocket(selectedTopic);
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      const topicList = await response.json();
      setTopics(topicList);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  const connectWebSocket = (topic: string) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log('Connecting to WebSocket:', `ws://localhost:8000/ws/chat/${topic}?token=token`);
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${topic}?token=token`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.onclose = (event) => {
      console.log('WebSocket Closed:', event);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      console.log('Received raw message:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('Parsed message data:', data);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          user: data.user || 'anonymous',
          message: data.message,
          isRight: data.user === 'me'  // Only right-align if it's our message
        }]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || !isConnected) {
      console.log('Cannot send message: ', {
        hasMessage: !!newMessage.trim(),
        hasWebSocket: !!wsRef.current,
        isConnected,
        readyState: wsRef.current?.readyState
      });
      return;
    }

    const messageData = {
      type: 'chat',
      message: newMessage
    };

    try {
      console.log('Sending message:', messageData);
      wsRef.current.send(JSON.stringify(messageData));
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: 'me',
        message: newMessage,
        isRight: true
      }]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const createTopic = async () => {
    if (!newTopic.trim()) return;
    
    try {
      const response = await fetch(`/api/topics/${newTopic}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchTopics(); // Refresh the topics list
        setNewTopic(""); // Clear the input
        setIsAddingTopic(false); // Hide the input
      }
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  const fetchMessageHistory = async (topic: string) => {
    try {
      const response = await fetch(`/api/messages/${topic}`);
      const history = await response.json();
      setMessages(history.map((msg: any) => ({
        id: msg.id,
        user: msg.user,
        message: msg.message,
        isRight: msg.user === 'me', // or however you want to determine message alignment
      })));
    } catch (error) {
      console.error('Failed to fetch message history:', error);
      setMessages([]);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="w-[250px] border-r border-gray-200 p-5 flex flex-col items-center">
        <h2 className="mb-5">Active Topics</h2>
        
        {isAddingTopic ? (
          <div className="w-full mb-4">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter topic name"
              className="w-full p-2 mb-2 border border-gray-200 rounded"
              onKeyPress={(e) => e.key === 'Enter' && createTopic()}
            />
            <div className="flex gap-2">
              <button
                onClick={createTopic}
                className="flex-1 p-2 bg-blue-500 text-white rounded cursor-pointer"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsAddingTopic(false);
                  setNewTopic("");
                }}
                className="flex-1 p-2 bg-gray-200 rounded cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTopic(true)}
            className="w-full p-3 mb-4 bg-blue-500 text-white rounded-lg cursor-pointer"
          >
            Add Topic
          </button>
        )}

        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`w-full p-3 border border-gray-200 font-bold rounded-lg mb-2 cursor-pointer
              ${selectedTopic === topic ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col h-screen">
        <div className="border-b border-gray-200 p-5 flex flex-col gap-2.5">
          <h2>{selectedTopic || "Select a topic"}</h2>
          {selectedTopic && (
            <div className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 flex-grow ${msg.isRight ? 'justify-end' : ''}`}
            >
              {!msg.isRight && (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2.5 flex-shrink-0 self-start mt-4">
                    {msg.avatar}
                  </div>
                  <div className="max-w-[60%] flex flex-col">
                    <div className="text-xs mb-1">{msg.user}</div>
                    <div className="bg-gray-100 p-2 px-3 rounded-xl">
                      {msg.message}
                    </div>
                  </div>
                </>
              )}
              {msg.isRight && (
                <div className="max-w-[60%] bg-blue-500 text-white p-2 px-3 rounded-xl">
                  {msg.message}
                </div>
              )}
            </div>
          ))}
        </div>

        <input
          type="text"
          placeholder="Send a message..."
          className="text-base p-3 border border-gray-200 rounded-lg mx-7 mb-7 outline-none"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
      </div>
    </div>
  );
}