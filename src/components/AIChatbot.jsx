import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Sparkles, User, Cpu, Trash2, ChevronDown, Zap } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "What are Ammar's top skills?",
  "Tell me about his AI projects",
  "Is he available for hire?",
  "What tech stack does he use?",
];

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const AI_CHAT_TIMEOUT_MS = 28000;

async function parseErrorResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null);
    return payload?.message || 'Stream unavailable';
  }

  const text = await response.text().catch(() => '');
  return text || 'Stream unavailable';
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Greeting. I am the portfolio intelligence core — trained on Ammar's complete profile. Ask me anything about his skills, projects, or availability.",
      time: formatTime()
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userMsg = text.trim();
    if (!userMsg || isStreaming) return;

    setInput('');
    setShowSuggestions(false);

    const updatedMessages = [...messages, { role: 'user', content: userMsg, time: formatTime() }];
    setMessages(updatedMessages);
    setIsStreaming(true);

    // Add empty AI message that we'll stream into
    const aiMsgIndex = updatedMessages.length;
    setMessages(prev => [...prev, { role: 'ai', content: '', time: formatTime(), streaming: true }]);

    // Scroll after adding AI message placeholder
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);

    let timeoutId;
    let didTimeout = false;

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      timeoutId = window.setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, AI_CHAT_TIMEOUT_MS);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      if (!response.body) {
        throw new Error('Stream unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let completed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.chunk) {
              accumulated += evt.chunk;
              setMessages(prev => {
                const next = [...prev];
                next[aiMsgIndex] = { ...next[aiMsgIndex], content: accumulated, streaming: true };
                return next;
              });
              if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            } else if (evt.done) {
              completed = true;
              setMessages(prev => {
                const next = [...prev];
                next[aiMsgIndex] = { ...next[aiMsgIndex], content: evt.response || accumulated, streaming: false };
                return next;
              });
            } else if (evt.error) {
              completed = true;
              setMessages(prev => {
                const next = [...prev];
                next[aiMsgIndex] = { ...next[aiMsgIndex], content: evt.message || 'Error from intelligence core.', streaming: false };
                return next;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }

      if (!completed) {
        setMessages(prev => {
          const next = [...prev];
          next[aiMsgIndex] = {
            ...next[aiMsgIndex],
            content: accumulated || 'The AI assistant ended the stream unexpectedly. Please try again.',
            streaming: false
          };
          return next;
        });
      }
    } catch (err) {
      if (didTimeout) {
        setMessages(prev => {
          const next = [...prev];
          next[aiMsgIndex] = {
            role: 'ai',
            content: 'The AI assistant timed out. Please try again in a moment.',
            time: formatTime(),
            streaming: false
          };
          return next;
        });
      } else if (err.name !== 'AbortError') {
        setMessages(prev => {
          const next = [...prev];
          next[aiMsgIndex] = {
            role: 'ai',
            content: err?.message || 'Connection failure. Intelligence core unreachable.',
            time: formatTime(),
            streaming: false
          };
          return next;
        });
      }
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };
  const handleSuggestion = (q) => sendMessage(q);

  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([{ role: 'ai', content: "Chat cleared. Intelligence core reset. How can I assist you?", time: formatTime() }]);
    setShowSuggestions(true);
    setIsStreaming(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Chat"
        className="fixed bottom-6 right-6 z-[95] flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/40 backdrop-blur-xl text-cyan-300 hover:bg-cyan-500/30 transition-colors"
        style={{ boxShadow: '0 0 20px rgba(34,211,238,0.3)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        animate={isOpen ? {} : {
          boxShadow: ['0 0 18px rgba(34,211,238,0.25)', '0 0 32px rgba(34,211,238,0.55)', '0 0 18px rgba(34,211,238,0.25)']
        }}
        transition={isOpen ? {} : { duration: 2.5, repeat: Infinity }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <ChevronDown size={24} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <Bot size={26} />
            </motion.span>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-24 right-6 z-[100] w-[390px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/88 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:right-8"
          >
            {/* Header */}
            <div className="relative border-b border-white/8 bg-gradient-to-r from-cyan-950/40 to-violet-950/30 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                    <Sparkles size={17} className="text-cyan-400" />
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      Ammar's AI Core
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-widest text-violet-400/80 bg-violet-400/10 border border-violet-400/20 rounded-full px-2 py-0.5">
                        <Zap size={8} /> 2.5 Flash
                      </span>
                    </h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-cyan-400/50 mt-0.5">
                      {isStreaming ? 'Generating...' : 'Intelligence Core Online'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={handleClear} title="Clear chat" className="h-8 w-8 flex items-center justify-center rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="absolute top-4 right-20 text-cyan-400/6 pointer-events-none select-none">
                <Cpu size={52} />
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-[360px] overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8, x: msg.role === 'ai' ? -6 : 6 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="h-6 w-6 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Bot size={12} className="text-cyan-400" />
                    </div>
                  )}
                  <div className="max-w-[82%]">
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'ai'
                        ? 'bg-white/5 border border-white/8 text-white/90 rounded-tl-none'
                        : 'bg-cyan-500/15 border border-cyan-400/25 text-white rounded-tr-none'
                    }`}>
                      {msg.content || (msg.streaming && (
                        <span className="flex gap-1.5 items-center py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" />
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.3s]" />
                        </span>
                      ))}
                      {msg.streaming && msg.content && (
                        <span className="inline-block w-0.5 h-3.5 bg-cyan-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                    {msg.time && !msg.streaming && (
                      <p className={`text-[10px] text-white/18 mt-1 ${msg.role === 'ai' ? 'text-left pl-1' : 'text-right pr-1'}`}>
                        {msg.time}
                      </p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-6 w-6 rounded-lg bg-violet-500/10 border border-violet-400/20 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                      <User size={12} className="text-violet-400" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Suggested Questions */}
              {showSuggestions && !isStreaming && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pt-1 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-white/20 pl-1">Suggested</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSuggestion(q)}
                        className="text-xs px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/8 text-cyan-300/65 hover:text-cyan-200 hover:border-cyan-400/40 hover:bg-cyan-500/15 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-white/3 border-t border-white/8 flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Ammar's work..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/18 focus:outline-none focus:border-cyan-400/40 transition-colors"
                disabled={isStreaming}
              />
              <motion.button
                type="submit"
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/35 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                whileTap={{ scale: 0.9 }}
                disabled={!input.trim() || isStreaming}
              >
                <Send size={16} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
