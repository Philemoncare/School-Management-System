'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRealtime, useRealtimeEvent } from '@/hooks/use-realtime';
import {
  Send,
  Search,
  Plus,
  MoreVertical,
  Users,
  Clock,
  CheckCheck
} from 'lucide-react';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { socket } = useRealtime();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId]);

  useRealtimeEvent(socket, 'new_message', (msg) => {
    if (msg.conversationId === selectedId) {
      setMessages(prev => [...prev, msg]);
    }
    loadConversations();
  });

  async function loadConversations() {
    try {
      const data = await apiFetch('/messages/conversations');
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(id: string) {
    try {
      const data = await apiFetch(`/messages/conversations/${id}`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;

    try {
      const sent = await apiFetch(`/messages/conversations/${selectedId}/send`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage }),
      });
      setMessages(prev => [...prev, sent]);
      setNewMessage('');
    } catch (err) {
      alert('Failed to send message');
    }
  }

  if (loading) return <div className="p-8 text-center text-warm-400 font-bold uppercase tracking-wide animate-pulse">Establishing secure communication...</div>;

  const activeConversation = conversations.find(c => c.id === selectedId);

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar: Conversations List */}
      <div className="w-80 lg:w-96 border-r border-warm-200 bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
          <h2 className="text-xl font-semibold text-charcoal-900 tracking-tight">Messages</h2>
          <button className="p-2 bg-forest-700 text-white rounded-xl shadow-lg shadow-sage-100 hover:bg-forest-800 transition-all"><Plus size={18}/></button>
        </div>
        <div className="p-4 bg-card border-b border-warm-100">
           <div className="bg-warm-100 px-3 py-2 rounded-xl flex items-center">
              <Search size={16} className="text-warm-400 mr-2" />
              <input type="text" placeholder="Search chats..." className="bg-transparent border-none text-xs font-bold w-full focus:ring-0" />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                selectedId === conv.id ? 'bg-forest-700 text-white shadow-xs shadow-sage-100' : 'hover:bg-ivory-50 text-charcoal-900'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-semibold border ${
                selectedId === conv.id ? 'bg-card/20 border-white/10 text-white' : 'bg-warm-100 border-warm-100 text-warm-500'
              }`}>
                {conv.title ? conv.title[0] : conv.participants[0].user.firstName[0]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                   <p className="text-sm font-semibold truncate leading-tight">{conv.title || `${conv.participants[0].user.firstName} ${conv.participants[0].user.lastName}`}</p>
                   <span className={`text-[11px] font-bold uppercase ${selectedId === conv.id ? 'text-white/60' : 'text-warm-400'}`}>
                     {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                </div>
                <p className={`text-xs truncate ${selectedId === conv.id ? 'text-white/80' : 'text-warm-500 font-medium'}`}>
                  {conv.messages[0]?.content || 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="py-20 text-center text-warm-400 font-bold uppercase text-[11px] tracking-wide">No active conversations</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-ivory-50 relative">
        {selectedId ? (
          <>
            {/* Chat Header */}
            <header className="h-16 bg-card border-b border-warm-200 px-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sage-50 text-forest-700 flex items-center justify-center font-semibold">
                    {activeConversation?.title ? activeConversation.title[0] : 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal-900 leading-tight">
                      {activeConversation?.title || 'Conversation'}
                    </p>
                    <p className="text-[11px] font-semibold text-success-500 uppercase tracking-wide">Active Now</p>
                  </div>
               </div>
               <button className="p-2 text-warm-400 hover:text-charcoal-900 transition-colors"><MoreVertical size={20}/></button>
            </header>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col">
               {messages.map((msg, i) => {
                 const isMe = true; // In real app: msg.senderId === user.id

                 return (
                   <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] group`}>
                         {!isMe && <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-tighter mb-1 ml-1">{msg.sender.firstName}</p>}
                         <div className={`p-4 rounded-3xl text-sm font-bold shadow-sm ${
                           isMe ? 'bg-forest-700 text-white rounded-tr-none' : 'bg-card text-charcoal-800 rounded-tl-none border border-warm-100'
                         }`}>
                           {msg.content}
                         </div>
                         <div className={`mt-1 flex items-center gap-1.5 ${isMe ? 'justify-end pr-1' : 'pl-1'}`}>
                            <span className="text-[11px] font-bold text-warm-400 uppercase tracking-tighter">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <CheckCheck size={12} className="text-forest-500" />}
                         </div>
                      </div>
                   </div>
                 );
               })}
               <div className="h-4" />
            </div>

            {/* Message Input */}
            <div className="p-6 bg-card border-t border-warm-200">
               <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Type your message securely..."
                    className="flex-1 bg-ivory-50 border-none px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-forest-700 focus:bg-card transition-all shadow-inner"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-forest-700 text-white p-4 rounded-2xl shadow-xs shadow-sage-100 hover:bg-forest-800 transition-all flex items-center justify-center disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send size={20} />
                  </button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
             <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center shadow-xs shadow-warm-200 mb-8 border border-warm-100">
                <Users size={40} className="text-forest-700" />
             </div>
             <h3 className="text-2xl font-semibold text-charcoal-900 tracking-tight">Select a conversation</h3>
             <p className="text-warm-400 font-medium mt-2 max-w-xs">Start a secure internal discussion with teachers, staff or authorized guardians.</p>
          </div>
        )}
      </div>
    </div>
  );
}
