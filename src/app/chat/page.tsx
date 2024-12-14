"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';

interface Class {
  id: string;
  code: string;
  name: string;
  instructor: string;
}

interface Emote {
  name: string;
  url: string;
}

interface Message {
  id: string;
  user: string;
  message: string;
  avatar?: string;
  isRight?: boolean;
  parsedContent?: (string | Emote)[];
}

interface TopicState {
  messages: Message[];
  connection: WebSocket | null;
  isConnected: boolean;
}

export default function ChatPage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [newTopic, setNewTopic] = useState("");
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  
  const [topicStates, setTopicStates] = useState<Map<string, TopicState>>(new Map());
  const [emoteCache, setEmoteCache] = useState<Map<string, Emote>>(new Map());
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(localStorage.getItem('username'));
  }, []);

  useEffect(() => {
    fetchTopics().then((topicList: string[]) => {
      topicList.forEach((topic: string) => {
        connectWebSocket(topic);
      });
    });
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      const topicState = topicStates.get(selectedTopic);
      if (topicState) {
        setMessages(topicState.messages);
      }
    }
  }, [selectedTopic, topicStates]);

  useEffect(() => {
    return () => {
      // Close all connections when component unmounts
      topicStates.forEach((state) => {
        state.connection?.close();
      });
    };
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      const topicList = await response.json();
      setTopics(topicList);
      return topicList;
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      return [];
    }
  };

  const connectWebSocket = (topic: string) => {
    if (topicStates.get(topic)?.connection) {
      return;
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${topic}?token=token`);

    ws.onopen = () => {
      setTopicStates(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(topic) || { messages: [], connection: ws, isConnected: true };
        newMap.set(topic, { ...currentState, isConnected: true });
        return newMap;
      });
    };

    ws.onclose = (event) => {
      console.log('WebSocket Closed:', event);
      setTopicStates(prev => {
        const newMap = new Map(prev);
        const currentState = newMap.get(topic) || { messages: [], connection: null, isConnected: false };
        newMap.set(topic, { ...currentState, isConnected: false });
        return newMap;
      });
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const parsedContent = await parseMessage(data.message);
        const newMessage = {
          id: Date.now().toString(),
          user: data.user || 'anonymous',
          message: data.message,
          isRight: data.user === currentUser,
          parsedContent
        };

        setTopicStates(prev => {
          const newMap = new Map(prev);
          const currentState = newMap.get(topic) || { messages: [], connection: ws, isConnected: true };
          newMap.set(topic, {
            ...currentState,
            messages: [...currentState.messages, newMessage]
          });
          return newMap;
        });

        if (topic === selectedTopic) {
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setTopicStates(prev => {
      const newMap = new Map(prev);
      newMap.set(topic, { messages: [], connection: ws, isConnected: false });
      return newMap;
    });
  };

  const sendMessage = async () => {
    const topicState = topicStates.get(selectedTopic);
    if (!newMessage.trim() || !topicState?.connection || !topicState.isConnected || !currentUser) {
      return;
    }
  
    const messageData = {
      type: 'chat',
      message: newMessage,
      user: currentUser
    };
  
    try {
      console.log('Sending message:', messageData);
      topicState.connection.send(JSON.stringify(messageData));

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
        fetchTopics();
        setNewTopic("");
        setIsAddingTopic(false);
      }
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  const fetchEmote = async (emoteName: string): Promise<Emote | null> => {
    if (emoteCache.has(emoteName)) {
      return emoteCache.get(emoteName)!;
    }

    try {
      const response = await fetch(`/api/emotes/${emoteName}`);
      if (response.ok) {
        const emote: Emote = {
          name: emoteName,
          url: `/api/emotes/${emoteName}`
        };
        setEmoteCache(prev => new Map(prev).set(emoteName, emote));
        return emote;
      }
    } catch (error) {
      console.error('Failed to fetch emote:', emoteName, error);
    }
    return null;
  };

  const parseMessage = async (message: string): Promise<(string | Emote)[]> => {
    const parts: (string | Emote)[] = [];
    const emoteRegex = /:([a-zA-Z0-9_]+):/g;
    let lastIndex = 0;
    
    for (const match of message.matchAll(emoteRegex)) {
      const [fullMatch, emoteName] = match;
      const matchIndex = match.index!;
      
      if (matchIndex > lastIndex) {
        parts.push(message.slice(lastIndex, matchIndex));
      }
      
      const emote = await fetchEmote(emoteName);
      if (emote) {
        parts.push(emote);
      } else {
        parts.push(fullMatch);
      }
      
      lastIndex = matchIndex + fullMatch.length;
    }
    
    if (lastIndex < message.length) {
      parts.push(message.slice(lastIndex));
    }
    
    return parts;
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
            <div className={`text-xs ${topicStates.get(selectedTopic)?.isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {topicStates.get(selectedTopic)?.isConnected ? 'Connected' : 'Connecting...'}
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
                    <div className="bg-gray-100 p-2 px-3 rounded-xl flex flex-wrap items-center gap-1">
                      {msg.parsedContent?.map((content, i) => 
                        typeof content === 'string' ? (
                          <span key={i}>{content}</span>
                        ) : (
                          <Image
                            key={i}
                            src={content.url}
                            alt={content.name}
                            width={24}
                            height={24}
                            className="inline-block align-middle"
                          />
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
              {msg.isRight && (
                <div className="max-w-[60%] bg-blue-500 text-white p-2 px-3 rounded-xl flex flex-wrap items-center gap-1">
                  {msg.parsedContent?.map((content, i) => 
                    typeof content === 'string' ? (
                      <span key={i}>{content}</span>
                    ) : (
                      <Image
                        key={i}
                        src={content.url}
                        alt={content.name}
                        width={24}
                        height={24}
                        className="inline-block align-middle"
                      />
                    )
                  )}
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