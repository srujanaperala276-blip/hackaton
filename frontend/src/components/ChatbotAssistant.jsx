import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, ChevronDown } from 'lucide-react';
import axios from 'axios';
import './ChatbotAssistant.css';

export default function ChatbotAssistant({ context = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello 👋 I'm your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTriggerClick = () => {
    if (isFlying) return;
    
    setIsFlying(true);
    // Animation duration is 1.5s
    setTimeout(() => {
      setIsFlying(false);
      setIsExpanded(true);
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/chat', {
        message: input,
        history: messages.slice(1), 
        context: context
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my servers. Please ensure the backend is running and the GROQ_API_KEY is valid." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Cinematic Color Grade Backdrop */}
      <div className={`bot-backdrop ${isExpanded ? 'active' : ''}`} onClick={() => setIsExpanded(false)} />
      
      <div className="bot-container">
        {!isExpanded ? (
        <div 
          className={`bot-trigger ${isFlying ? 'flying' : ''}`}
          onClick={handleTriggerClick}
        >
          <Bot />
          {!isFlying && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
          )}
        </div>
      ) : (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="header-title">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base m-0">Srujana AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="status-dot"></div>
                  <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-white"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="messages-area">
            {messages.map((msg, idx) => (
              <div key={idx} className={`bubble ${msg.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                {msg.content}
              </div>
            ))}
            
            {isLoading && (
              <div className="typing">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="input-area">
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="chat-input"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="send-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1 mt-3 opacity-40">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-800">Powered by Groq AI</span>
            </div>
          </form>
        </div>
      )}
    </div>
  </>
  );
}
