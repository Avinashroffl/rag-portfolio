import { useState, useEffect, useRef } from 'react';
import { searchVectorStore } from './utils/rag';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, Bot, ArrowRight, X, Cpu, Server, Zap, Sparkles, Moon, Sun, Copy, Check } from 'lucide-react';
import './App.css';

const AIMessage = ({ content, onSuggestionClick }) => {
  const [copied, setCopied] = useState(false);

  let mainContent = content;
  let suggestions = [];
  
  const suggestionsMatch = content.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/);
  if (suggestionsMatch) {
    mainContent = content.replace(suggestionsMatch[0], '').trim();
    const rawSuggestions = suggestionsMatch[1];
    suggestions = rawSuggestions.split('|').map(s => s.trim()).filter(s => s.length > 0);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(mainContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="message-content-wrapper">
      <div className="message-actions">
        <button className="copy-btn" onClick={handleCopy} title="Copy response">
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
        </button>
      </div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainContent}</ReactMarkdown>
      
      {suggestions.length > 0 && (
        <div className="ai-suggestions-container">
          {suggestions.map((s, idx) => (
            <button key={idx} className="ai-suggestion-pill" onClick={() => onSuggestionClick(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vectorStore, setVectorStore] = useState([]);
  const [showArch, setShowArch] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    "What are Avinash's top skills?",
    "Tell me about his work experience",
    "What projects has he built?",
    "How can I contact Avinash?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}vector_store.json`)
      .then(res => res.json())
      .then(data => setVectorStore(data))
      .catch(() => console.error('Could not load vector store.'));
  }, []);

  const handleSearch = async (e, forcedQuery = null) => {
    if (e) e.preventDefault();
    const q = forcedQuery || query;
    if (!q.trim()) return;

    const userMessage = { role: 'user', content: q };
    setMessages(prev => [...prev, userMessage]);
    if (!forcedQuery) setQuery('');
    setLoading(true);

    try {
      const topResults = await searchVectorStore(userMessage.content, vectorStore);
      const context = topResults.map(r => r.content).join('\n\n');

      const workerUrl = 'https://rag-portfolio-worker.rajnash69.workers.dev/'; 
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content, context })
      });

      if (!response.ok) throw new Error(`Worker returned status ${response.status}`);

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ Error generating response: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const isChatStarted = messages.length > 0;

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="top-nav">
        <div className="nav-logo">
          <strong>Avinash R</strong>
          <span className="nav-subtitle">AI Portfolio · Ask me anything</span>
        </div>
      </nav>

      {!isChatStarted ? (
        <div className="hero-section">
          <div className="hero-overline">AI PORTFOLIO</div>
          <h1 className="hero-title">Welcome to my space! 👋</h1>
          <h2 className="hero-subtitle">I'm your virtual assistant.</h2>
          <p className="hero-desc">Ask me anything about Avinash's technical skills, experience, or projects.</p>

          <div className="search-container">
            <form className="hero-search-form" onSubmit={(e) => handleSearch(e, null)}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question..."
                disabled={loading || vectorStore.length === 0}
              />
              <button type="submit" className="hero-submit-btn" disabled={loading || !query.trim()}>
                <ArrowRight size={20} />
              </button>
            </form>

            <div className="quick-questions">
              {quickQuestions.map((q, idx) => (
                <button key={idx} className="quick-btn" onClick={() => handleSearch(null, q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
          
          <div className="hero-footer-text">
            Every answer is grounded in cited sources · <button onClick={() => setShowArch(true)} className="arch-link">Powered by Serverless RAG</button>
          </div>
        </div>
      ) : (
        <div className="chat-view">
          <div className="messages-container">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-icon">
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className="message-bubble">
                  {msg.role === 'ai' ? (
                    <AIMessage content={msg.content} onSuggestionClick={(q) => handleSearch(null, q)} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message ai">
                <div className="message-icon"><Bot size={18} /></div>
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input-area">
            <form className="chat-input-form" onSubmit={(e) => handleSearch(e, null)}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask another question..."
                disabled={loading}
              />
              <button type="submit" className="chat-submit-btn" disabled={loading || !query.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {showArch && (
        <div className="modal-overlay" onClick={() => setShowArch(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowArch(false)}>
              <X size={24} />
            </button>
            
            <h2>Zero-Cost Serverless RAG</h2>
            <p>This portfolio isn't just a static page—it's a fully functional <strong>Retrieval-Augmented Generation (RAG)</strong> pipeline built to be highly scalable and 100% free to host.</p>
            
            <div className="arch-grid">
              <div className="arch-card">
                <h3><Cpu size={20} color="#f06a4a" /> Client-Side Vectors</h3>
                <p>Instead of paying for a vector database like Pinecone, all of Avinash's resume and portfolio data is pre-embedded into a static JSON file. When you ask a question, WebAssembly runs in your browser to calculate the math locally!</p>
              </div>
              <div className="arch-card">
                <h3><Server size={20} color="#8b5cf6" /> Cloudflare Edge Worker</h3>
                <p>API keys can't be exposed in frontend code. So, the frontend talks to a Cloudflare Worker deployed to the edge. It acts as a secure, stateless proxy that forwards the retrieved context to the LLM.</p>
              </div>
              <div className="arch-card">
                <h3><Zap size={20} color="#10b981" /> High-Availability Fallback</h3>
                <p>The edge worker uses Groq's lightning-fast Llama 3 model as the primary LLM, but if it hits a rate limit, it instantly catches it and falls back to Google's Gemini—ensuring the chat never goes down.</p>
              </div>
              <div className="arch-card">
                <h3><Sparkles size={20} color="#3b82f6" /> 100% Automated CI/CD</h3>
                <p>Every time Avinash updates his markdown resume on GitHub, an Action automatically spins up Python, recalculates the AI vectors, builds the React app, and deploys it live—requiring zero manual work.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dark Mode Toggle */}
      <button 
        className="theme-toggle" 
        onClick={() => setIsDarkMode(!isDarkMode)}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </div>
  );
}

export default App;
