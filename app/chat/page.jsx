"use client";

import { useState } from "react";
import Link from "next/link";

const classes = [
  {
    id: 1,
    code: "CSCI 104",
    name: "Data Structures and Object Oriented Design",
    instructor: "Andrew Goodney",
  },
  {
    id: 2,
    code: "CSCI 170",
    name: "Discrete Methods in Computer Science",
    instructor: "Shaddin Dughmi",
  },
  {
    id: 3,
    code: "CSCI 201",
    name: "Principles of Software Development",
    instructor: "Marco Papa",
  },
  {
    id: 4,
    code: "CSCI 270",
    name: "Introduction to Algorithms and Theory of Computation",
    instructor: "Aaron Cote",
  },
];

const messages = [
  { id: 1, user: "presidentfolt", message: "Hey class", avatar: "😊" },
  { id: 2, user: "tommytrojan", message: "Hello", avatar: "😊" },
  { id: 3, user: "anonymous", message: "I love Marco Papa!", isRight: true },
  { id: 4, user: "papathegpat", message: "Me too!", avatar: "😊" },
  { id: 5, user: "anonymous", message: "Hey class", isRight: true },
  {
    id: 6,
    user: "anonymous",
    message:
      "I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!I love John Doe!",
    isRight: true,
  },
  {
    id: 7,
    user: "anonymous",
    message:
      "I love Jane Doe!sdfsd sadlkjf asdfjlsk lksjld kfs sdlkjfl;skjf lksf jl;sakdjfkjsa;kfj slkflas flksa;dfj;asl ;f",
    isRight: true,
  },
  { id: 8, user: "anonymous", message: "I love CSCI 104!", isRight: true },
  { id: 9, user: "anonymous", message: "I love CSCI 201!", isRight: true },
  {
    id: 10,
    user: "anonymous",
    message:
      "I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!I love CSCI 350!",
  },
  {
    id: 11,
    user: "anonymous",
    message: "I love CSCI 360! asdfsdfsadfsa dlskfjskajdf",
  },
  { id: 12, user: "anonymous", message: "I love CSCI 201!", isRight: true },
];

const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  backgroundColor: "white",
};

const sidebarStyle = {
  width: "250px",
  borderRight: "1px solid #e5e5e5",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
};

const chatContainerStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  height: "100vh",
};

const headerStyle = {
  borderBottom: "1px solid #e5e5e5",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const messageContainerStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "30px",
};

const inputStyle = {
  fontSize: "16px",
  padding: "12px",
  border: "1px solid #e5e5e5",
  borderRadius: "8px",
  margin: "10px 27px 27px 27px",
  outline: "none",
};

const messageStyle = {
  display: "flex",
  marginBottom: "16px",
  flexGrow: 1
};

const avatarStyle = {
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

export default function ChatPage() {
  const [newMessage, setNewMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(classes[0]);

  const handleClassSelect = (cls) => {
    setSelectedChat(cls);
  };

  return (
    <div style={containerStyle}>
      <div style={sidebarStyle}>
        <h2 style={{ marginBottom: "20px" }}>Classes currently in session</h2>
        {classes.map((cls) => (
          <button
            key={cls.name}
            onClick={() => handleClassSelect(cls)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #e5e5e5",
              fontWeight: "bold",
              borderRadius: "8px",
              marginBottom: "8px",
              backgroundColor: selectedChat.id === cls.id ? "#007AFF" : "white",
              color: selectedChat.id === cls.id ? "white" : "black",
              cursor: "pointer",
              marginBottom: "8px",
              marginTop: "8px",
            }}
          >
            {cls.code}
          </button>
        ))}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              backgroundColor: "#007AFF",
            }}
          ></div>
          <span>wesley123</span>
        </div>
      </div>
      <div style={chatContainerStyle}>
        <div style={headerStyle}>
          <h2>
            {selectedChat.code} - {selectedChat.name}
          </h2>
          <div>Instructor: {selectedChat.instructor}</div>
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
                  <div style={{maxWidth: "60%"}}>
                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                      {msg.user}
                    </div>
                    <div style={bubbleStyle}>{msg.message}</div>
                  </div>
                </>
              )}
              {msg.isRight && (
                <div style={{ maxWidth: "60%", ...bubbleStyle, ...rightBubbleStyle }}>
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
        />
      </div>
    </div>
  );
}
