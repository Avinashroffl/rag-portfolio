import { useState, useEffect, useRef } from 'react';
import { searchVectorStore } from './utils/rag';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, Sparkles, X, Server, Zap, Cpu, Code2 } from 'lucide-react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm the AI assistant for Avinash R. Ask me about his experience, tech stack, or projects!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [vectorStore, setVectorStore] = useState([]);
  const [showArch, setShowArch] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetch('/vector_store.json')
      .then(res => res.json())
      .then(data => setVectorStore(data))
      .catch(() => setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Could not load vector store.' }]));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const topResults = await searchVectorStore(userMessage.content, vectorStore);
      const context = topResults.map(r => r.content).join('\n\n');

      // The Live Cloudflare Worker Proxy URL
      const workerUrl = 'https://avinashroffl.rajnash69.workers.dev/'; 
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

  return (
    <div className="app-container">
      <div className="chat-wrapper">
        
        <div className="chat-header">
          <div className="header-avatar">
            <Sparkles size={24} color="white" />
          </div>
          <div className="header-info">
            <h1>Ask about me (Avinash)</h1>
          </div>
        </div>

        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-icon">
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className="message-bubble">
                {msg.role === 'ai' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
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
        
        <div className="input-area">
          <form className="input-form" onSubmit={handleSearch}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about my experience..."
              disabled={loading || vectorStore.length === 0}
            />
            <button type="submit" className="send-button" disabled={loading || !query.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
      
      <footer className="app-footer">
        <button className="arch-link" onClick={() => setShowArch(true)}>
          <Code2 size={16} /> How is this site built? (Zero-Cost Architecture)
        </button>
      </footer>

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
                <h3><Cpu size={20} color="#3b82f6" /> Client-Side Vectors</h3>
                <p>Instead of paying for a vector database like Pinecone, all of Avinash's resume and portfolio data is pre-embedded into a static JSON file. When you ask a question, WebAssembly runs in your browser to calculate the math locally!</p>
              </div>
              <div className="arch-card">
                <h3><Server size={20} color="#8b5cf6" /> Cloudflare Edge Worker</h3>
                <p>API keys can't be exposed in frontend code. So, the frontend talks to a Cloudflare Worker deployed to the edge. It acts as a secure, stateless proxy that forwards the retrieved context to the LLM.</p>
              </div>
              <div className="arch-card">
                <h3><Zap size={20} color="#10b981" /> High-Availability Fallback</h3>
                <p>The edge worker uses Groq's lightning-fast OpenAI GPT-OSS model as the primary LLM, but if it hits a rate limit, it instantly catches it and falls back to Google's Gemini—ensuring the chat never goes down.</p>
              </div>
              <div className="arch-card">
                <h3><Sparkles size={20} color="#f59e0b" /> React + Glassmorphism</h3>
                <p>The UI is built with React and Vite, utilizing modern CSS features like <code>backdrop-filter</code> and dynamic CSS variables to create a premium, interactive glassmorphism experience.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
