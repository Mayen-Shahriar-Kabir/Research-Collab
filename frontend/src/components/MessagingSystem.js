import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './MessagingSystem.css';
import { API_BASE_URL } from '../config';

// Normalize API base URL
const API_BASE = API_BASE_URL.replace('/api', '');

const MessagingSystem = ({ userId, userRole }) => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const { authToken, currentUser } = useAuth();

  useEffect(() => {
    console.log('MessagingSystem - userId:', userId, 'authToken:', !!authToken, 'currentUser:', currentUser);
    if (userId && authToken) {
      fetchMessages();
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [userId, authToken]);

  const fetchMessages = useCallback(async () => {
    if (!userId || !authToken) {
      console.log('fetchMessages: Missing userId or authToken', { userId, authToken: !!authToken });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching messages for userId:', userId);
      console.log('Using authToken:', authToken.substring(0, 10) + '...');
      const response = await fetch(`${API_BASE}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Messages response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Messages fetch error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched messages count:', data.length);
      console.log('Fetched messages data:', data);
      setMessages(data);
      organizeConversations(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Only show alert if this is the initial load, not a refresh after sending
      if (loading) {
        alert('Failed to load messages. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, authToken]);

  // Search users by name/email for starting a chat
  useEffect(() => {
    if (!showNewChat || !authToken || !userId) return;
    
    const searchUsers = async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ 
          query: searchQuery || '' 
        });
        
        console.log('Searching users with query:', searchQuery);
        const res = await fetch(`${API_BASE}/api/messages/search?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Search response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Search error response:', errorText);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Search results:', data);
        // Transform search results to use consistent ID format
        const transformedResults = (data || []).map(user => ({
          ...user,
          _id: user._id || user.id
        }));
        setSearchResults(transformedResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    
    const delayDebounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, showNewChat, userId, authToken]);

  const fetchUsers = useCallback(async () => {
    if (!userId || !authToken) return;
    
    try {
      // Skip the contacts endpoint since it doesn't exist, go straight to messages
      const messagesResponse = await fetch(`${API_BASE}/api/messages`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const uniqueUsers = new Map();
        
        messagesData.forEach(msg => {
          if (msg.sender?._id !== userId && !uniqueUsers.has(msg.sender?._id)) {
            uniqueUsers.set(msg.sender?._id, msg.sender);
          }
          if (msg.recipient?._id !== userId && !uniqueUsers.has(msg.recipient?._id)) {
            uniqueUsers.set(msg.recipient?._id, msg.recipient);
          }
        });
        
        setUsers(Array.from(uniqueUsers.values()));
      }
    } catch (error) {
      console.error('Error fetching users from messages:', error);
      setUsers([]);
    }
  }, [userId, authToken]);

  const organizeConversations = (messageList) => {
    console.log('Organizing conversations from messageList:', messageList);
    const convMap = new Map();
    
    messageList.forEach(msg => {
      const otherUserId = msg.sender?._id === userId ? msg.recipient?._id : msg.sender?._id;
      const otherUser = msg.sender?._id === userId ? msg.recipient : msg.sender;
      
      console.log('Processing message:', {
        msgId: msg._id,
        sender: msg.sender?._id,
        recipient: msg.recipient?._id,
        currentUserId: userId,
        otherUserId,
        otherUser: otherUser?.name || otherUser?.email
      });
      
      if (!otherUserId || !otherUser) {
        console.log('Skipping invalid message:', msg);
        return; // Skip invalid messages
      }
      
      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, {
          userId: otherUserId,
          user: otherUser,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        });
        console.log('Created new conversation for user:', otherUserId);
      }
      
      const conv = convMap.get(otherUserId);
      conv.messages.push(msg);
      
      if (!conv.lastMessage || new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
        conv.lastMessage = msg;
      }
      
      if (!msg.isRead && msg.recipient?._id === userId) {
        conv.unreadCount++;
      }
    });
    
    // Sort messages within each conversation chronologically
    convMap.forEach((conv, userId) => {
      conv.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      console.log(`Conversation with ${userId} has ${conv.messages.length} messages`);
    });
    
    const sortedConversations = Array.from(convMap.values()).sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });
    
    console.log('Final organized conversations:', sortedConversations);
    setConversations(sortedConversations);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !authToken) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    // Optimistically update UI
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: userId },
      recipient: { _id: selectedConversation.userId },
      content: messageContent,
      createdAt: new Date().toISOString(),
      isRead: false,
      isSending: true
    };
    
    // Update local state optimistically
    setMessages(prev => [...prev, tempMessage]);
    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, tempMessage],
      lastMessage: tempMessage
    }));

    try {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: selectedConversation.userId,
          content: messageContent
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const sentMessage = await response.json();
      console.log('Message sent successfully:', sentMessage);
      
      // Update with server response
      setMessages(prev => [
        ...prev.filter(m => m._id !== tempMessage._id),
        sentMessage
      ]);
      
      setSelectedConversation(prev => ({
        ...prev,
        messages: [
          ...prev.messages.filter(m => m._id !== tempMessage._id),
          sentMessage
        ],
        lastMessage: sentMessage
      }));
      
      // Refresh conversations to update unread counts, etc.
      try {
        await fetchMessages();
      } catch (refreshError) {
        console.warn('Failed to refresh messages after sending:', refreshError);
        // Don't show error to user since message was sent successfully
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Only show error if message actually failed to send
      if (error.message.includes('HTTP error') || error.message.includes('Failed to start conversation')) {
        alert('Failed to send message. Please try again.');
        
        // Remove optimistic message and show error
        setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
        setSelectedConversation(prev => ({
          ...prev,
          messages: prev.messages.filter(m => m._id !== tempMessage._id),
          lastMessage: prev.messages.filter(m => m._id !== tempMessage._id).slice(-1)[0] || null
        }));
      }
    }
  };

  const startNewConversation = async () => {
    if (!selectedRecipient || !newMessage.trim() || !authToken) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: selectedRecipient,
          content: messageContent
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to start conversation');
      }
      
      const sentMessage = await response.json();
      
      // Update UI with the new message
      setMessages(prev => [...prev, sentMessage]);
      
      // Reset new conversation state
      setSelectedRecipient('');
      setShowNewChat(false);
      // Refresh messages to update conversations list
      try {
        await fetchMessages();
      } catch (refreshError) {
        console.warn('Failed to refresh messages after starting conversation:', refreshError);
        // Don't show error to user since message was sent successfully
      }
      
      // Select the new conversation
      const existingConv = conversations.find(conv => conv.userId === sentMessage.recipient?._id);
      if (existingConv) {
        setSelectedConversation({
          ...existingConv,
          messages: [...existingConv.messages, sentMessage],
          lastMessage: sentMessage,
          unreadCount: 0
        });
      } else {
        setSelectedConversation({
          userId: sentMessage.recipient._id,
          user: sentMessage.recipient,
          messages: [sentMessage],
          lastMessage: sentMessage,
          unreadCount: 0
        });
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      
      // Only show error if message actually failed to send
      if (error.message.includes('HTTP error') || error.message.includes('Failed to start conversation')) {
        alert(error.message || 'Failed to start conversation. Please try again.');
      }
    }
  };

  const chooseRecipient = (user) => {
    setSelectedRecipient(user._id);
  };

  const markAsRead = async (messageId) => {
    if (!messageId || !authToken) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state to mark message as read
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
      
      // Update conversations to reflect read status
      setConversations(prev => 
        prev.map(conv => {
          const updatedMessages = conv.messages.map(msg => 
            msg._id === messageId ? { ...msg, isRead: true } : msg
          );
          
          // Update unread count if needed
          const unreadCount = updatedMessages.reduce(
            (count, msg) => count + (msg.recipient?._id === userId && !msg.isRead ? 1 : 0), 
            0
          );
          
          return {
            ...conv,
            messages: updatedMessages,
            unreadCount,
            lastMessage: 
              conv.lastMessage?._id === messageId 
                ? { ...conv.lastMessage, isRead: true } 
                : conv.lastMessage
          };
        })
      );
      
      // Update selected conversation if active
      if (selectedConversation) {
        setSelectedConversation(prev => {
          const updatedMessages = prev.messages.map(msg => 
            msg._id === messageId ? { ...msg, isRead: true } : msg
          );
          
          return {
            ...prev,
            messages: updatedMessages,
            unreadCount: updatedMessages.reduce(
              (count, msg) => count + (msg.recipient?._id === userId && !msg.isRead ? 1 : 0), 
              0
            ),
            lastMessage: 
              prev.lastMessage?._id === messageId 
                ? { ...prev.lastMessage, isRead: true } 
                : prev.lastMessage
          };
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      // Don't show error to user for read receipts
    }
  };

  const selectConversation = (conversation) => {
    console.log('Selecting conversation:', conversation);
    console.log('Conversation messages:', conversation.messages);
    setSelectedConversation(conversation);
    setShowNewChat(false);
    
    // Mark unread messages as read
    conversation.messages.forEach(msg => {
      if (!msg.isRead && msg.recipient?._id === userId) {
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
          {conversations.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No conversations yet. Start a new chat!
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.userId}
                className={`conversation-item ${selectedConversation?.userId === conv.userId ? 'active' : ''}`}
                onClick={() => selectConversation(conv)}
              >
                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="user-name">
                      {conv.user.profile?.name || conv.user.name || conv.user.email}
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
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                    {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))
          )}
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
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
              />
              <div className="search-results" style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, marginTop: 8 }}>
                {searching && <div style={{ padding: 8, color: '#666' }}>Searching...</div>}
                {!searching && searchResults.map(user => (
                  <div
                    key={user._id}
                    className={`search-result-item ${selectedRecipient === user._id ? 'selected' : ''}`}
                    style={{ padding: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    onClick={() => chooseRecipient(user)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontWeight: '500' }}>{user.name || user.profile?.name || 'No name'}</span>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>{user.email}</span>
                    </div>
                    <span style={{ opacity: 0.6, fontSize: '0.85em' }}>{user.role}</span>
                  </div>
                ))}
                {!searching && searchQuery && searchResults.length === 0 && (
                  <div style={{ padding: 8, color: '#999' }}>No users found</div>
                )}
              </div>
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
              {selectedConversation.messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                selectedConversation.messages.map(msg => {
                  console.log('Rendering message:', msg);
                  return (
                    <div 
                      key={msg._id} 
                      className={`message ${msg.sender?._id === userId ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{msg.content}</p>
                        <span className="message-timestamp">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
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
