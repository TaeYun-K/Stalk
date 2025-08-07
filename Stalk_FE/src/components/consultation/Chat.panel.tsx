import React, { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  type?: "system" | "user"; // 추가된 타입
}

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  sendChatMessage: () => void;
  currentUsername: string; 
}


const ChatPanel: React.FC<ChatPanelProps> = ({
  chatMessages,
  newMessage,
  setNewMessage,
  sendChatMessage,
  currentUsername,
}) => {

//채팅 스크롤 유지
const scrollContainerRef = useRef<HTMLDivElement>(null);
const messagesEndRef = useRef<HTMLDivElement>(null);


// 채팅창 스크롤이 생기면 자동으로 스크롤
useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container || !messagesEndRef.current) return;

    const isScrollable = container.scrollHeight > container.clientHeight;

    if (isScrollable) {
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }
}, [chatMessages]);

return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">채팅</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollContainerRef}>
        <div className="space-y-3">
          {chatMessages.map((msg) => {
              if (msg.type === "system") {
                return (
                <div key={msg.id} className="text-center text-xs text-gray-400 my-2">
                    {msg.message}
                </div>
                );
            }
            const isMine = msg.sender === currentUsername; // 현재 사용자 이름을 가져오는 함수 필요

            return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                    className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    isMine
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-700 text-white rounded-bl-none"
                    } break-words whitespace-pre-wrap`}
                >
                    <div className="text-sm font-medium mb-1">{msg.sender}</div>
                    <p className="text-sm">{msg.message}</p>
                    <div className="text-right text-xs text-gray-300 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                </div>
                </div>
            );
            })}
            <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // 🔐 Enter 누를 때 form submit 방지
                  sendChatMessage();
                }
              }}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendChatMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
