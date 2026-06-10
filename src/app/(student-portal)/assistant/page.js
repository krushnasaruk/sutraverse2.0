'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import { useAuth } from '@/frontend/context/AuthContext';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AssistantPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.chatWindow} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className={styles.avatar} style={{ width: 80, height: 80, fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 className={styles.emptyTitle}>Sign in Required</h2>
          <p className={styles.emptySubtitle} style={{ marginTop: '1rem' }}>
            Please log in to access the Sutras AI Assistant.
          </p>
        </div>
      </div>
    );
  }



  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim()) return;

    // Add user message to UI immediately
    const userMsg = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: updatedMessages,
          context: {
            name: user.name,
            branch: user.branch,
            year: user.year,
            semester: user.semester,
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

      // Add a placeholder message for the model
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
        content: `**Error:** ${err.message}. Please check your API key or internet connection.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text) => {
    handleSend(text);
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatWindow}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <div className={styles.avatar}>🧠</div>
            <div>
              <h1 className={styles.title}>Sutras AI</h1>
              <div className={styles.status}>
                <span className={styles.statusDot}></span>
                Online and ready
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button 
              className={styles.clearBtn} 
              onClick={() => setMessages([])}
              title="Clear chat history"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className={styles.chatArea}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.avatar} style={{ width: 80, height: 80, fontSize: '3rem', margin: '0 auto' }}>🤖</div>
              <h2 className={styles.emptyTitle}>How can I help you study?</h2>
              <p className={styles.emptySubtitle}>
                Ask me to explain concepts, plan a study schedule, or summarize topics for your upcoming exams.
              </p>
              <div className={styles.suggestions}>
                <button className={styles.suggestionPill} onClick={() => handleSuggestionClick("Suggest YouTube videos for Engineering Physics")}>
                  Suggest YouTube Videos
                </button>
                <button className={styles.suggestionPill} onClick={() => handleSuggestionClick("Create a 3-day study plan for Engineering Mathematics II")}>
                  Study plan for M2
                </button>
                <button className={styles.suggestionPill} onClick={() => handleSuggestionClick("Can you provide notes on Data Structures?")}>
                  Notes on Data Structures
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.modelRow}`}>
                <div className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.modelMessage}`}>
                  {msg.role === 'user' ? msg.content : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}

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

        {/* Input Bar */}
        <div className={styles.inputArea}>
          <form 
            className={styles.inputForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sutras AI a question..."
              className={styles.inputField}
              disabled={isLoading}
            />
            <button type="submit" className={styles.sendBtn} disabled={!input.trim() || isLoading}>
              ↑
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
