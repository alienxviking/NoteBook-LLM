"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Send, FileText, Bot, User, Loader2, Sparkles, Plus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NotebookLM() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setCurrentFile(file.name);
        setMessages([{ role: "assistant", content: `I've processed **${file.name}**. How can I help you understand it today?` }]);
      } else {
        alert(data.error || "Failed to upload file");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isChatting) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg }),
      });
      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. " + (data.error || "") }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to connect to the assistant." }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 glass border-none rounded-none bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg glow">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold gradient-text tracking-tight">NotebookLM</h1>
        </div>
        {currentFile && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 glass text-sm text-blue-300">
            <FileText className="w-4 h-4" />
            {currentFile}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="w-full max-w-4xl h-[80vh] flex flex-col gap-6 mt-16 z-10">
        <AnimatePresence mode="wait">
          {!currentFile && messages.length === 0 ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-8"
            >
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                  Interact with your <br />
                  <span className="gradient-text">knowledge base</span>
                </h2>
                <p className="text-neutral-400 text-lg max-w-xl mx-auto">
                  Upload a document and start a conversation. Get grounded answers 
                  instantly using Google Gemini and Qdrant.
                </p>
              </div>

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Document
                  </div>
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.txt" 
                onChange={handleFileUpload}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 glass flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
              >
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex gap-4 max-w-[85%]",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md",
                      msg.role === 'user' ? "bg-blue-600" : "bg-neutral-800"
                    )}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-200"
                    )}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isChatting && (
                  <div className="flex gap-4 max-w-[85%] mr-auto">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-neutral-800">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-800 text-neutral-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="p-6 pt-0">
                <div className="relative flex items-center gap-2 glass p-2 rounded-2xl bg-white/5 border-white/10 focus-within:border-blue-500/50 transition-colors">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question about your document..."
                    className="flex-1 bg-transparent border-none outline-none p-3 text-sm placeholder:text-neutral-500"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isChatting}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-widest px-2">
                  <span>Powered by Gemini 1.5 Flash</span>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Upload new
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf,.txt" 
        onChange={handleFileUpload}
      />
    </main>
  );
}
