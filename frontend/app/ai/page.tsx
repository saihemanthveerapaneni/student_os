"use client";

import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/store/useAuthStore";

interface ChatSession {
  id: string;
  title: string;
  model_name: string;
  messages: any[];
  updated_at: string;
}

export default function AIAssistantPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Model & prompt presets
  const [selectedModel, setSelectedModel] = useState("llama3.3");
  const [selectedFeature, setSelectedFeature] = useState("study_chat");
  const [inputMessage, setInputMessage] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const models = [
    { key: "llama3.3", name: "Llama 3.3 (High Quality)" },
    { key: "llama3.1", name: "Llama 3.1 (Fast Instant)" },
    { key: "qwen", name: "Qwen 2.5 (Logical)" },
    { key: "deepseek", name: "DeepSeek R1 Llama" }
  ];

  const presets = [
    { label: "Summarize notes", feature: "summarize_notes", prompt: "Please summarize the core concepts from my recent lecture on data structures." },
    { label: "Create a quiz", feature: "generate_quiz", prompt: "Create a 5-question multiple-choice quiz about Big O notation." },
    { label: "Build a study plan", feature: "study_plan", prompt: "Design a study plan for my upcoming linear algebra midterm on Friday." },
    { label: "Explain concept", feature: "explain_concepts", prompt: "Explain the difference between mitosis and meiosis using a simple analogy." },
    { label: "Homework help", feature: "assignment_help", prompt: "Help me guide through solving the time complexity of binary search." }
  ];

  const loadChatSessions = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("ai_chats")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadChatSessions();
  }, [user?.id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingResponse]);

  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session);
    setMessages(session.messages || []);
    setSelectedModel(session.model_name || "llama3.3");
  };

  const handleNewChat = () => {
    setActiveSession(null);
    setMessages([]);
    setSelectedFeature("study_chat");
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    setInputMessage(preset.prompt);
    setSelectedFeature(preset.feature);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming || !user?.id) return;

    const userMsg = { role: "user", content: inputMessage };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsStreaming(true);
    setStreamingResponse("");

    try {
      // Connect to FastAPI endpoint
      const response = await fetch("http://localhost:8000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
          feature: selectedFeature,
          temperature: 0.7
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to call AI service");
      }

      // Stream parsing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAIResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        fullAIResponse += text;
        setStreamingResponse(fullAIResponse);
      }

      const assistantMsg = { role: "assistant", content: fullAIResponse };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      setStreamingResponse("");

      // Save to database
      if (activeSession) {
        // Update existing chat
        const { error } = await supabase
          .from("ai_chats")
          .update({
            messages: finalMessages,
            updated_at: new Date().toISOString()
          })
          .eq("id", activeSession.id);
        if (!error) {
          loadChatSessions();
        }
      } else {
        // Create new chat session
        const chatTitle = userMsg.content.slice(0, 30) + "...";
        const { data, error } = await supabase
          .from("ai_chats")
          .insert({
            user_id: user.id,
            title: chatTitle,
            model_name: selectedModel,
            messages: finalMessages
          })
          .select()
          .single();
        if (!error && data) {
          setActiveSession(data);
          loadChatSessions();
        }
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Failed to fetch AI response from FastAPI core backend. Please verify that uvicorn server is running on http://localhost:8000." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-xl border border-outline-variant/20 shadow-sm bg-surface dark:bg-surface-container-low mt-4">
        {/* Left Side: Chat Sessions History */}
        <aside className="w-72 bg-surface-container-lowest dark:bg-surface-container-low border-r border-outline-variant/30 flex flex-col py-lg px-md overflow-y-auto">
          <div className="flex items-center justify-between mb-md px-xs">
            <h2 className="text-title-md font-bold text-on-surface">AI Chats</h2>
            <button 
              onClick={handleNewChat}
              className="text-primary hover:bg-primary-container/10 p-xs rounded-md transition-colors cursor-pointer"
              title="New Chat"
            >
              <span className="material-symbols-outlined text-[20px]">add_comment</span>
            </button>
          </div>

          <div className="space-y-base flex-grow">
            {sessions.length === 0 ? (
              <p className="text-[11px] text-on-surface-variant text-center mt-lg">No past chat history.</p>
            ) : (
              sessions.map((s) => {
                const isActive = activeSession?.id === s.id;
                return (
                  <button 
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`w-full text-left px-sm py-2.5 rounded-lg text-body-md truncate transition-all cursor-pointer ${
                      isActive 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                      <span className="truncate">{s.title}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Side: Chat Workspace */}
        <section className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
          
          {/* Top Panel: Model & Context Options */}
          <div className="p-sm bg-surface-container-lowest dark:bg-surface-container-low border-b border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-sm z-10 shadow-sm">
            <div className="flex items-center gap-sm">
              <span className="text-title-md font-bold text-on-surface hidden sm:inline">Selected LLM:</span>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-sm py-1.5 bg-surface border border-outline-variant/35 rounded-lg text-body-md text-on-surface focus:outline-none"
              >
                {models.map(m => <option key={m.key} value={m.key}>{m.name}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-sm">
              <span className="text-title-md font-bold text-on-surface hidden sm:inline">Tutor Mode:</span>
              <select 
                value={selectedFeature} 
                onChange={(e) => setSelectedFeature(e.target.value)}
                className="px-sm py-1.5 bg-surface border border-outline-variant/35 rounded-lg text-body-md text-on-surface focus:outline-none"
              >
                <option value="study_chat">General Tutor Chat</option>
                <option value="explain_concepts">Explain Concept Professor</option>
                <option value="summarize_notes">Notes Summarizer</option>
                <option value="generate_quiz">Quiz Examiner</option>
                <option value="generate_flashcards">Flashcard Generator</option>
                <option value="study_plan">Study Plan Planner</option>
                <option value="assignment_help">Homework Guidance Helper</option>
                <option value="code_help">Senior Code Helper</option>
              </select>
            </div>
          </div>

          {/* Messages Flow Canvas */}
          <div className="flex-grow overflow-y-auto px-lg py-lg custom-scrollbar pb-32">
            <div className="max-w-2xl mx-auto space-y-md">
              
              {/* Empty welcome page */}
              {messages.length === 0 && !streamingResponse && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl mx-auto flex items-center justify-center mb-md shadow-sm">
                    <span className="material-symbols-outlined text-[32px] icon-fill">smart_toy</span>
                  </div>
                  <h3 className="text-headline-md font-bold text-on-surface mb-xs">How can I help you study today?</h3>
                  <p className="text-body-lg text-on-surface-variant">I'm your StudentOS AI tutor, ready to explain concepts, generate quizzes, or summarize note files.</p>
                </div>
              )}

              {/* Message Bubbles */}
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-sm max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex-shrink-0 flex items-center justify-center mt-1">
                          <span className="material-symbols-outlined text-primary text-[18px] icon-fill">smart_toy</span>
                        </div>
                      )}
                      <div className={`rounded-2xl px-md py-sm shadow-sm text-body-md leading-relaxed whitespace-pre-wrap ${
                        isUser 
                          ? "bg-primary text-on-primary rounded-tr-sm" 
                          : "bg-surface-container-lowest dark:bg-surface-container-low text-on-surface border border-outline-variant/15 rounded-tl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Streaming Content */}
              {streamingResponse && (
                <div className="flex justify-start">
                  <div className="flex gap-sm max-w-[85%] flex-row">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 flex-shrink-0 flex items-center justify-center mt-1">
                      <span className="material-symbols-outlined text-primary text-[18px] icon-fill">smart_toy</span>
                    </div>
                    <div className="rounded-2xl px-md py-sm shadow-sm text-body-md leading-relaxed whitespace-pre-wrap bg-surface-container-lowest dark:bg-surface-container-low text-on-surface border border-outline-variant/15 rounded-tl-sm animate-pulse">
                      {streamingResponse}
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Form message input (Fixed bottom layout) */}
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-sm px-md">
            <div className="max-w-2xl mx-auto flex flex-col gap-sm">
              {/* Presets suggestions tags */}
              {messages.length === 0 && (
                <div className="flex gap-xs overflow-x-auto hide-scrollbar pb-xs">
                  {presets.map((preset) => (
                    <button 
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className="flex-shrink-0 bg-surface-container-lowest border border-outline-variant/40 hover:border-primary text-on-surface-variant hover:text-primary rounded-full px-sm py-1 text-label-md font-semibold transition-all shadow-sm cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input text box */}
              <form onSubmit={handleSendMessage} className="bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all p-2 flex items-end gap-xs">
                <button type="button" className="p-sm text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container cursor-pointer">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <textarea 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Ask your AI tutor anything..."
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none py-1.5 text-body-lg text-on-surface placeholder-outline/50 focus:ring-0 max-h-24 custom-scrollbar"
                  style={{ minHeight: "36px" }}
                />
                <button 
                  type="submit" 
                  disabled={isStreaming}
                  className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-primary/95 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined icon-fill text-[18px]">send</span>
                </button>
              </form>
              
              <div className="text-center">
                <p className="text-[10px] text-outline font-medium">AI can make errors. Verify critical facts against syllabus notes.</p>
              </div>
            </div>
          </div>

        </section>
      </div>
    </AppLayout>
  );
}
