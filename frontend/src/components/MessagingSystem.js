import React, { useState, useEffect } from 'react';
import './MessagingSystem.css';

const MessagingSystem = ({ userId, userRole }) => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        organizeConversations(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would need a users endpoint in your backend
      // For now, we'll use the messages to get user info
      const response = await fetch(`http://localhost:5000/api/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const uniqueUsers = new Map();
        
        data.forEach(msg => {
          if (msg.sender._id !== userId && !uniqueUsers.has(msg.sender._id)) {
            uniqueUsers.set(msg.sender._id, msg.sender);
          }
          if (msg.recipient._id !== userId && !uniqueUsers.has(msg.recipient._id)) {
            uniqueUsers.set(msg.recipient._id, msg.recipient);
          }
        });
        
        setUsers(Array.from(uniqueUsers.values()));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const organizeConversations = (messageList) => {
    const convMap = new Map();
    
    messageList.forEach(msg => {
      const otherUserId = msg.sender._id === userId ? msg.recipient._id : msg.sender._id;
      const otherUser = msg.sender._id === userId ? msg.recipient : msg.sender;
      
      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, {
          userId: otherUserId,
          user: otherUser,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        });
      }
      
      const conv = convMap.get(otherUserId);
      conv.messages.push(msg);
      
      if (!conv.lastMessage || new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
        conv.lastMessage = msg;
      }
      
      if (!msg.isRead && msg.recipient._id === userId) {
        conv.unreadCount++;
      }
    });
    
    const sortedConversations = Array.from(convMap.values()).sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });
    
    setConversations(sortedConversations);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: userId,
          recipient: selectedConversation.userId,
          content: newMessage.trim()
        }),
      });
      
      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [sentMessage, ...prev]);
        
        // Update the selected conversation
        setSelectedConversation(prev => ({
          ...prev,
          messages: [sentMessage, ...prev.messages],
          lastMessage: sentMessage
        }));
        
        setNewMessage('');
        fetchMessages(); // Refresh to get updated conversations
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startNewConversation = async () => {
    if (!selectedRecipient || !newMessage.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: userId,
          recipient: selectedRecipient,
          content: newMessage.trim()
        }),
      });
      
      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [sentMessage, ...prev]);
        setNewMessage('');
        setSelectedRecipient('');
        setShowNewChat(false);
        fetchMessages();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await fetch(`http://localhost:5000/api/messages/${messageId}/read`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowNewChat(false);
    
    // Mark unread messages as read
    conversation.messages.forEach(msg => {
      if (!msg.isRead && msg.recipient._id === userId) {
        markAsRead(msg._id);
      }
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) return <div className="loading">Loading messages...</div>;

  return (
    <div className="messaging-system">
      <div className="messaging-sidebar">
        <div className="sidebar-header">
          <h3>Messages</h3>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowNewChat(true)}
          >
            New Chat
          </button>
        </div>
        
        <div className="conversations-list">
          {conversations.map(conv => (
            <div 
              key={conv.userId}
              className={`conversation-item ${selectedConversation?.userId === conv.userId ? 'active' : ''}`}
              onClick={() => selectConversation(conv)}
            >
              <div className="conversation-info">
                <div className="conversation-header">
                  <span className="user-name">
                    {conv.user.profile?.name || conv.user.email}
                  </span>
                  <span className="user-role">{conv.user.role}</span>
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount}</span>
                  )}
                </div>
                {conv.lastMessage && (
                  <div className="last-message">
                    <span className="message-preview">
                      {conv.lastMessage.content.length > 50 
                        ? conv.lastMessage.content.substring(0, 50) + '...'
                        : conv.lastMessage.content
                      }
                    </span>
                    <span className="message-time">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="messaging-main">
        {showNewChat ? (
          <div className="new-chat">
            <div className="new-chat-header">
              <h3>Start New Conversation</h3>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowNewChat(false)}
              >
                Cancel
              </button>
            </div>
            <div className="new-chat-form">
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="form-control"
              >
                <option value="">Select recipient...</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.profile?.name || user.email} ({user.role})
                  </option>
                ))}
              </select>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="form-control message-input"
                rows="4"
              />
              <button 
                onClick={startNewConversation}
                className="btn btn-primary"
                disabled={!selectedRecipient || !newMessage.trim()}
              >
                Send Message
              </button>
            </div>
          </div>
        ) : selectedConversation ? (
          <div className="chat-area">
            <div className="chat-header">
              <h3>{selectedConversation.user.profile?.name || selectedConversation.user.email}</h3>
              <span className="user-role-badge">{selectedConversation.user.role}</span>
            </div>
            
            <div className="messages-container">
              {selectedConversation.messages
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .map(msg => (
                <div 
                  key={msg._id} 
                  className={`message ${msg.sender._id === userId ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{msg.content}</p>
                    <span className="message-timestamp">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="message-input-area">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="form-control message-input"
                rows="3"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button 
                onClick={sendMessage}
                className="btn btn-primary"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="no-conversation">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingSystem;
