import React from "react";

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  sendChatMessage: () => void;
}


const ChatPanel: React.FC<ChatPanelProps> = ({
  chatMessages,
  newMessage,
  setNewMessage,
  sendChatMessage,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">채팅</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium">{msg.sender}</span>
                <span className="text-xs text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-200">{msg.message}</p>
            </div>
          ))}
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
