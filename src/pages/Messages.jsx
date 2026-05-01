import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Edit, MoreVertical, Phone, Video, Info, Image as ImageIcon, Smile, Send, MessageCircle } from "lucide-react";
import MainLayout from "../components/layouts/MainLayout";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useSelector } from "react-redux";

const dummyConversations = [
  { id: 1, name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?u=alice", lastMessage: "See you tomorrow!", time: "10:30 AM", unread: 2, online: true },
  { id: 2, name: "Bob Smith", avatar: "https://i.pravatar.cc/150?u=bob", lastMessage: "That's hilarious 😂", time: "Yesterday", unread: 0, online: false },
  { id: 3, name: "Charlie Davis", avatar: "https://i.pravatar.cc/150?u=charlie", lastMessage: "Can you send the files?", time: "Monday", unread: 0, online: true },
  { id: 4, name: "Diana Prince", avatar: "https://i.pravatar.cc/150?u=diana", lastMessage: "Thanks for the help!", time: "Sunday", unread: 0, online: false },
];

const dummyMessages = [
  { id: 1, sender: "Alice Johnson", text: "Hey! Are we still on for tomorrow?", time: "10:15 AM", isMe: false },
  { id: 2, sender: "Me", text: "Yes absolutely! What time works for you?", time: "10:20 AM", isMe: true },
  { id: 3, sender: "Alice Johnson", text: "Let's meet at 11 AM at the usual coffee shop.", time: "10:25 AM", isMe: false },
  { id: 4, sender: "Me", text: "Perfect. See you tomorrow!", time: "10:30 AM", isMe: true },
];

const Messages = () => {
  const { isDarkMode } = useSelector((state) => state.ui);
  const [activeChat, setActiveChat] = useState(null);

  return (
    <MainLayout sidebar={<Sidebar />} topbar={<Topbar />}>
      <div className="h-[calc(100vh-130px)] md:h-[calc(100vh-90px)] w-full p-0 md:p-4 max-w-6xl mx-auto flex gap-0 md:gap-4">
        
        {/* Left Sidebar - Conversations List */}
        <div className={`w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 lg:rounded-2xl border-0 lg:border border-slate-200 dark:border-slate-800 shadow-none lg:shadow-sm overflow-hidden ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h1>
            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <Edit size={16} />
            </button>
          </div>
          
          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          
          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {dummyConversations.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat)}
                className={`flex items-center gap-3 p-3 mx-2 mb-1 cursor-pointer rounded-xl transition ${activeChat?.id === chat.id ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <div className="relative">
                  <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className={`text-sm font-semibold truncate ${activeChat?.id === chat.id ? 'text-purple-700 dark:text-purple-300' : 'text-slate-900 dark:text-white'}`}>{chat.name}</h3>
                    <span className="text-[10px] text-slate-500">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate ${chat.unread > 0 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                      {chat.lastMessage}
                    </p>
                    {chat.unread > 0 && (
                      <span className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center text-[9px] font-bold text-white ml-2">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area - Chat Window */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 lg:rounded-2xl border-0 lg:border border-slate-200 dark:border-slate-800 shadow-none lg:shadow-sm overflow-hidden ${!activeChat ? 'hidden lg:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  </button>
                  <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">{activeChat.name}</h2>
                    <p className="text-xs text-green-500 font-medium">{activeChat.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-slate-500 dark:text-slate-400">
                  <button className="hover:text-purple-500 transition"><Phone size={18} /></button>
                  <button className="hover:text-purple-500 transition"><Video size={18} /></button>
                  <button className="hover:text-purple-500 transition"><Info size={18} /></button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="text-center">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Today
                  </span>
                </div>
                
                {dummyMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2 ${
                      msg.isMe 
                        ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white rounded-tr-none shadow-md shadow-purple-500/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-purple-100' : 'text-slate-400'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-2 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-end gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800 p-1 pl-2 sm:p-2 sm:pl-4 rounded-3xl border border-slate-200 dark:border-slate-700 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400 transition-all">
                  <button className="p-2 text-slate-400 hover:text-purple-500 transition">
                    <Smile size={20} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-purple-500 transition hidden sm:block">
                    <ImageIcon size={20} />
                  </button>
                  <textarea 
                    rows="1"
                    placeholder="Type a message..." 
                    className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-white resize-none outline-none py-2.5 max-h-24 placeholder:text-slate-400"
                  />
                  <button className="w-9 h-9 sm:w-10 sm:h-10 mb-0.5 mr-0.5 sm:mb-0 sm:mr-0 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30 transition transform hover:scale-105 flex-shrink-0">
                    <Send size={16} className="ml-1 sm:ml-0" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-900/50">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center text-purple-500 dark:text-purple-400">
                <MessageCircle size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Your Messages</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Select a conversation from the left or start a new one to chat with your friends.
              </p>
              <button className="mt-6 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition">
                New Message
              </button>
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
};

export default Messages;
