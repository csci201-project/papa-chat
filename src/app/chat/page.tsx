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
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [topicStates, setTopicStates] = useState<Map<string, TopicState>>(new Map());
  const [emoteCache, setEmoteCache] = useState<Map<string, Emote>>(new Map());
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(localStorage.getItem('username'));
    setIsAdmin(localStorage.getItem('username') == 'admin');
  }, []);

  useEffect(() => {
    fetchTopics().then((topicList: string[]) => {
      setTopics(topicList);
    });
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      // Connect WebSocket if needed
      connectWebSocket(selectedTopic);
      
      // Load existing messages
      const topicState = topicStates.get(selectedTopic);
      if (topicState) {
        setMessages([...topicState.messages]);
      }
    }
  }, [selectedTopic]);

  useEffect(() => {
    return () => {
      // Close all connections when component unmounts
      topicStates.forEach((state) => {
        state.connection?.close();
      });
    };
  }, []);

  useEffect(() => {
    console.log("Messages updated:", messages);
  }, [messages]);

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
    if (topicStates.get(topic)?.connection?.readyState === WebSocket.OPEN) {
        console.log("WebSocket already connected for topic:", topic);
        return;
    }

    console.log("Connecting WebSocket for topic:", topic);
    
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${topic}?token=token`);

    // Set initial state immediately
    setTopicStates(prev => {
        const newMap = new Map(prev);
        newMap.set(topic, { 
            messages: prev.get(topic)?.messages || [], 
            connection: ws, 
            isConnected: false 
        });
        return newMap;
    });

    ws.onopen = () => {
        console.log('WebSocket Connected:', topic, 'State:', ws.readyState);
        setTopicStates(prev => {
            const newMap = new Map(prev);
            const currentState = newMap.get(topic);
            newMap.set(topic, { 
                messages: currentState?.messages || [], 
                connection: ws, 
                isConnected: true 
            });
            return newMap;
        });
    };

    ws.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("WebSocket received:", data, "for topic:", topic);
            
            const parsedContent = await parseMessage(data.message);
            const newMessage = {
                id: Date.now().toString(),
                user: data.user || 'anonymous',
                message: data.message,
                isRight: data.user === currentUser,
                parsedContent
            };

            // Update messages immediately if this is the selected topic
            if (topic === selectedTopic) {
                setMessages(prev => {
                    console.log("Updating messages:", [...prev, newMessage]);
                    return [...prev, newMessage];
                });
            }

            // Update topic state
            setTopicStates(prev => {
                const newMap = new Map(prev);
                const currentState = newMap.get(topic);
                if (!currentState) {
                    console.log("No state for topic:", topic);
                    return prev;
                }
                
                const newState = {
                    ...currentState,
                    messages: [...currentState.messages, newMessage]
                };
                console.log("Updated topic state:", topic, newState);
                newMap.set(topic, newState);
                return newMap;
            });
        } catch (error) {
            console.error('Error handling message:', error, event.data);
        }
    };

    // Add reconnection logic
    ws.onclose = (event) => {
        console.log('WebSocket closed for topic:', topic, 'Code:', event.code, 'Reason:', event.reason);
        setTopicStates(prev => {
            const newMap = new Map(prev);
            const currentState = newMap.get(topic);
            if (currentState) {
                newMap.set(topic, { ...currentState, connection: null, isConnected: false });
            }
            return newMap;
        });

        // Attempt to reconnect after a delay
        setTimeout(() => {
            if (topic === selectedTopic) {
                console.log("Attempting to reconnect to topic:", topic);
                connectWebSocket(topic);
            }
        }, 1000);
    };

    return ws;
  };

  const sendMessage = async () => {
    const topicState = topicStates.get(selectedTopic);
    if (!newMessage.trim() || !currentUser) {
        return;
    }

    if (!topicState?.connection || topicState.connection.readyState !== WebSocket.OPEN) {
        console.log("WebSocket not open, state:", topicState?.connection?.readyState);
        connectWebSocket(selectedTopic);
        return;
    }

    const messageData = {
        type: 'chat',
        message: newMessage,
        user: currentUser
    };

    try {
        console.log('Sending message:', messageData, 'WebSocket state:', topicState.connection.readyState);
        topicState.connection.send(JSON.stringify(messageData));
        setNewMessage('');
    } catch (error) {
        console.error('Error sending message:', error);
        if (topicState.connection.readyState !== WebSocket.OPEN) {
            console.log("WebSocket closed during send, reconnecting...");
            connectWebSocket(selectedTopic);
        }
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
        console.log("Creating topic:", newTopic);
        const response = await fetch(`/api/topics/${newTopic}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log("Topic created successfully");
            await fetchTopics();
            setNewTopic("");
            setIsAddingTopic(false);
        } else {
            console.error("Failed to create topic:", await response.text());
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
      <div className="w-[250px] border-r border-gray-200 p-5 flex flex-col">
        <h2 className="mb-5">Active Topics</h2>
        
        <div className="flex-1">
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
            isAdmin && (<button
              onClick={() => setIsAddingTopic(true)}
              className="w-full p-3 mb-4 bg-blue-500 text-white rounded-lg cursor-pointer"
            >
              Add Topic
            </button>)
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

        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {currentUser?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="font-medium">{currentUser}</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('username');
              window.location.href = '/login';
            }}
            className="w-full py-2 px-4 bg-white text-slate-500 text-sm border rounded-lg hover:bg-slate-100 transition-colors"
          >
            Logout
          </button>
        </div>
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
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2.5 flex-shrink-0 self-start mt-4 text-gray-500 text-sm font-medium">
                    {msg.user?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="max-w-[400px] flex flex-col">
                    <div className="text-xs mb-1">{msg.user}</div>
                    <div className="bg-gray-100 p-2 px-3 rounded-xl flex flex-col">
                      {msg.parsedContent?.map((content, i) => 
                        typeof content === 'string' ? (
                          <span key={i} className="break-all whitespace-pre-wrap">{content}</span>
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
                <div className="max-w-[400px] bg-blue-500 text-white p-2 px-3 rounded-xl flex flex-col">
                    {msg.parsedContent?.map((content, i) => 
                        typeof content === 'string' ? (
                            <span key={i} className="break-all whitespace-pre-wrap">{content}</span>
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

        <textarea
          placeholder="Send a message..."
          className="text-base p-3 border border-gray-200 rounded-lg mx-7 mb-7 outline-none resize-none h-[44px] max-h-[120px] overflow-y-auto"
          value={newMessage}
          onChange={(e) => {
            const textarea = e.target as HTMLTextAreaElement;
            textarea.style.height = '44px';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
            setNewMessage(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
                (e.target as HTMLTextAreaElement).style.height = '44px';
            }
          }}
          rows={1}
        />
      </div>
    </div>
  );
}