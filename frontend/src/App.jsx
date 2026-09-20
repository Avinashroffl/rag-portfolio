import { useState, useEffect, useRef } from 'react';
import { searchVectorStore } from './utils/rag';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, ArrowRight } from 'lucide-react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vectorStore, setVectorStore] = useState([]);
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
            Every answer is grounded in cited sources · Powered by Serverless RAG
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
    </div>
  );
}

export default App;
