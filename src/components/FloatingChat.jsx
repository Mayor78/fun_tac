// src/components/FloatingChat.jsx - WITH BADGE
import { useState, useEffect, useRef } from 'react';
import { sendChatMessage, subscribeToChat } from '../lib/gameService';
import { getPlayerId, getPlayerName } from '../utils/gameLogic';
import toast from 'react-hot-toast';

export default function FloatingChat({ gameId, playerId, playerName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const chatEndRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const notificationSound = useRef(null);

  // Create audio element for notification
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    notificationSound.current = {
      play: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
        oscillator.stop(audioContext.currentTime + 0.3);
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      }
    };
  }, []);

  // Subscribe to chat messages
  useEffect(() => {
    if (!gameId) return;
    
    const unsubscribe = subscribeToChat(gameId, (messages) => {
      const newCount = messages.length;
      
      // Check if there are new messages
      if (lastMessageCountRef.current > 0 && newCount > lastMessageCountRef.current && !isOpen) {
        // New message received while chat is closed
        const newMessagesCount = newCount - lastMessageCountRef.current;
        setUnreadCount(prev => prev + newMessagesCount);
        setHasNewMessage(true);
        
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        // Play sound
        if (notificationSound.current) {
          notificationSound.current.play().catch(console.error);
        }
      }
      
      setChatMessages(messages);
      lastMessageCountRef.current = newCount;
    });
    
    return () => unsubscribe();
  }, [gameId, isOpen]);

  // Auto-scroll chat when open and new messages
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  // Reset unread count when chat is opened
  const toggleChat = () => {
    if (!isOpen) {
      // Opening chat - reset unread count
      setUnreadCount(0);
      setHasNewMessage(false);
    }
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (chatInput.length > 200) {
      toast.error('Message too long (max 200 chars)');
      return;
    }
    
    try {
      await sendChatMessage(gameId, playerId, playerName, chatInput.trim());
      setChatInput('');
      
      // Vibrate on send (optional)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button with Badge */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4d9fff, #ff4d6d)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          animation: 'scaleIn 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(77,159,255,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        }}
      >
        <span style={{ fontSize: '24px' }}>💬</span>
        
        {/* Unread Badge - Always visible when > 0 */}
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '22px',
              height: '22px',
              borderRadius: '11px',
              background: '#ff4d6d',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
              animation: hasNewMessage ? 'pulse 0.5s ease-in-out 3' : 'none',
              boxShadow: '0 0 10px rgba(255,77,109,0.5)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Chat Window Popup */}
      {isOpen && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '150px',
            right: '20px',
            width: '340px',
            height: '480px',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.3s ease',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(77,159,255,0.1), rgba(255,77,109,0.1))',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💬</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Game Chat</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                ({chatMessages.length})
              </span>
              {/* Small badge in header showing unread */}
              {unreadCount > 0 && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: '#ff4d6d',
                  color: 'white',
                }}>
                  +{unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleChat();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {chatMessages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  padding: '60px 20px',
                }}
              >
                <span style={{ fontSize: '48px' }}>💬</span>
                <p style={{ marginTop: '12px' }}>No messages yet</p>
                <p style={{ fontSize: '11px', marginTop: '4px' }}>Say something to your opponent!</p>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => {
              const isOwnMessage = msg.playerId === playerId;
              const showAvatar = idx === 0 || chatMessages[idx - 1]?.playerId !== msg.playerId;
              
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  {showAvatar && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: isOwnMessage ? '#4dffaa' : '#4d9fff',
                        marginBottom: '3px',
                        marginLeft: isOwnMessage ? '0' : '8px',
                        marginRight: isOwnMessage ? '8px' : '0',
                        fontWeight: 'bold',
                      }}
                    >
                      {msg.playerName}
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '9px 14px',
                      borderRadius: '16px',
                      background: isOwnMessage
                        ? 'linear-gradient(135deg, rgba(77,255,170,0.15), rgba(77,255,170,0.05))'
                        : 'var(--bg-elevated)',
                      border: `1px solid ${isOwnMessage ? 'rgba(77,255,170,0.3)' : 'var(--border)'}`,
                      wordWrap: 'break-word',
                    }}
                  >
                    <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                      {msg.message}
                    </div>
                    <div
                      style={{
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        marginTop: '5px',
                        textAlign: 'right',
                      }}
                    >
                      {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '8px',
              background: 'var(--bg-card)',
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              maxLength={200}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4d9fff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              style={{
                padding: '8px 20px',
                borderRadius: '24px',
                background: chatInput.trim() ? 'linear-gradient(135deg, #4d9fff, #ff4d6d)' : 'var(--bg-elevated)',
                border: 'none',
                color: chatInput.trim() ? 'white' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}