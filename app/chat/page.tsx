"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from 'react';

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
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();
  const [newTopic, setNewTopic] = useState("");
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    backgroundColor: "white",
  };

  const sidebarStyle: CSSProperties = {
    width: "250px",
    borderRight: "1px solid #e5e5e5",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const chatContainerStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  };

  const headerStyle: CSSProperties = {
    borderBottom: "1px solid #e5e5e5",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const messageContainerStyle: CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "30px",
  };

  const inputStyle: CSSProperties = {
    fontSize: "16px",
    padding: "12px",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    margin: "10px 27px 27px 27px",
    outline: "none",
  };

  const messageStyle: CSSProperties = {
    display: "flex",
    marginBottom: "16px",
    flexGrow: 1,
  };

  const avatarStyle: CSSProperties = {
    width: "33px",
    height: "33px",
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "10px",
    flexShrink: 0,
  };

  const bubbleStyle = {
    backgroundColor: "#f0f0f0",
    padding: "8px 12px",
    borderRadius: "12px",
  };

  const rightMessageStyle = {
    justifyContent: "flex-end",
  };

  const rightBubbleStyle = {
    backgroundColor: "#007AFF",
    color: "white",
  };

  const profileButtonStyle = {
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "16px",
  };

  return (
    <div style={containerStyle}>
      <div style={sidebarStyle}>
        <h2 style={{ marginBottom: "20px" }}>Active Topics</h2>
        
        {isAddingTopic ? (
          <div style={{ width: "100%", marginBottom: "16px" }}>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter topic name"
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "8px",
                border: "1px solid #e5e5e5",
                borderRadius: "4px",
              }}
              onKeyPress={(e) => e.key === 'Enter' && createTopic()}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={createTopic}
                style={{
                  padding: "8px",
                  backgroundColor: "#007AFF",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsAddingTopic(false);
                  setNewTopic("");
                }}
                style={{
                  padding: "8px",
                  backgroundColor: "#e5e5e5",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTopic(true)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "16px",
              backgroundColor: "#007AFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Add Topic
          </button>
        )}

        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e5e5e5",
              fontWeight: "bold",
              borderRadius: "8px",
              marginBottom: "8px",
              backgroundColor: selectedTopic === topic ? "#007AFF" : "white",
              color: selectedTopic === topic ? "white" : "black",
              cursor: "pointer",
            }}
          >
            {topic}
          </button>
        ))}
        {/* Rest of your sidebar content... */}
      </div>
      <div style={chatContainerStyle}>
        <div style={headerStyle}>
          <h2>{selectedTopic || "Select a topic"}</h2>
          {selectedTopic && (
            <div style={{ 
              fontSize: '12px', 
              color: isConnected ? '#4CAF50' : '#f44336' 
            }}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </div>
          )}
        </div>
        <div style={messageContainerStyle}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...messageStyle,
                ...(msg.isRight ? rightMessageStyle : {}),
              }}
            >
              {!msg.isRight && (
                <>
                  <div style={avatarStyle}>{msg.avatar}</div>
                  <div style={{ maxWidth: "60%" }}>
                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                      {msg.user}
                    </div>
                    <div style={bubbleStyle}>{msg.message}</div>
                  </div>
                </>
              )}
              {msg.isRight && (
                <div
                  style={{
                    maxWidth: "60%",
                    ...bubbleStyle,
                    ...rightBubbleStyle,
                  }}
                >
                  {msg.message}
                </div>
              )}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Send a message..."
          style={inputStyle}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}

// Your existing styles remain the same...