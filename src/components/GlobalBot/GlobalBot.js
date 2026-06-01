'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './GlobalBot.module.css';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function GlobalBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  const chatEndRef = useRef(null);
  const { user } = useAuth();
  const pathname = usePathname();

  // Auto-scroll
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        content: "Hi! I'm your Sutras Copilot. I can answer questions or find any study materials, PYQs, or assignments for you. What do you need?"
      }]);
      setHasUnread(true);
    }
  }, [messages.length]);

  const toggleBot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setHasUnread(false);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const textToSend = input;
    setInput('');
    setIsLoading(true);

    const userMsg = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages,
          context: {
            name: user?.name,
            branch: user?.branch,
            year: user?.year,
            semester: user?.semester,
            currentPath: pathname
          }
        }),
      });

      if (!res.ok) {
        let errMessage = 'Failed to fetch response';
        try {
            const data = await res.json();
            errMessage = data.error || errMessage;
        } catch(e) {}
        throw new Error(errMessage);
      }

      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkValue = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: newMessages[lastIndex].content + chunkValue
            };
            return newMessages;
          });
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `**Error:** ${err.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render full bot if on the dedicated assistant page or mobile redirect
  if (pathname === '/assistant' || (pathname && pathname.startsWith('/mobile-auth'))) return null;

  return (
    <div className={styles.botContainer}>
      {/* Expandable Chat Window */}
      <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.avatar}>🧠</span>
            Sutras Copilot
          </div>
          <button className={styles.closeBtn} onClick={toggleBot}>×</button>
        </div>

        <div className={styles.chatArea}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.modelRow}`}>
              <div className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.modelMessage}`}>
                {msg.role === 'user' ? msg.content : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className={`${styles.messageRow} ${styles.modelRow}`}>
             <div className={styles.typingIndicator}>
               <span className={styles.typingDot}></span>
               <span className={styles.typingDot}></span>
               <span className={styles.typingDot}></span>
             </div>
           </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form className={styles.inputArea} onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask or search for files..."
            className={styles.inputField}
            disabled={isLoading}
          />
          <button type="submit" className={styles.sendBtn} disabled={!input.trim() || isLoading}>
            ↑
          </button>
        </form>
      </div>

      {/* Floating Action Button */}
      <button className={styles.fab} onClick={toggleBot}>
        <span className={styles.fabIcon}>✨</span>
        {!isOpen && hasUnread && <span className={styles.badge}>1</span>}
      </button>
    </div>
  );
}
