import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';
import { api } from '../lib/api.js';

const BotAvatar = () => (
  <div className="ai-chat-avatar">
    <img src="/icons/icon.png" alt="Superplot AI" />
  </div>
);

export default function AIChat({ propertyId, propertyName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e?.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    setProgressText('');

    try {
      const result = await api.askAI(q, propertyId || null, (stage) => {
        setProgressText(stage);
      });
      setMessages(prev => [...prev, { role: 'ai', text: result.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: err.message }]);
    } finally {
      setProgressText('');
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="ai-chat-fab" onClick={() => setOpen(true)} title="Ask Superplot AI">
        <Bot size={22} />
      </button>
    );
  }

  return (
    <div className="ai-chat-panel">
      <div className="ai-chat-header">
        <div className="ai-chat-header-title">
          <img src="/icons/icon.png" alt="" style={{ width: 20, height: 20 }} />
          <span>Superplot AI</span>
        </div>
        {propertyName && <span className="ai-chat-scope">{propertyName}</span>}
        <button className="ai-chat-close" onClick={() => setOpen(false)}><X size={18} /></button>
      </div>

      <div className="ai-chat-messages">
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            <BotAvatar />
            <p><strong>Hi! I'm Superplot AI.</strong></p>
            <p>Ask me anything about your property documents.</p>
            <div className="ai-chat-suggestions">
              {[
                'What is the registration number on my sale deed?',
                'When does my property tax expire?',
                'Summarize my encumbrance certificate',
              ].map(s => (
                <button key={s} className="ai-chat-suggestion" onClick={() => { setInput(s); }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`ai-chat-msg ai-chat-msg-${m.role}`}>
            {m.role === 'ai' && <BotAvatar />}
            <div className="ai-chat-msg-text">{m.text}</div>
          </div>
        ))}

        {loading && (
          <div className="ai-chat-msg ai-chat-msg-ai">
            <BotAvatar />
            <div className="ai-chat-msg-text ai-chat-progress">
              <span className="ai-chat-progress-text">{progressText}</span>
              <span className="ai-chat-dots"><span /><span /><span /></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="ai-chat-input-row" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          className="ai-chat-input"
          placeholder="Ask Superplot AI..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="ai-chat-send" disabled={!input.trim() || loading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
