import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreHorizontal, 
  Paperclip, 
  Smile,
  Circle,
  MessageSquare,
  Users,
  Star,
  Archive,
  Trash2
} from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import { Modal } from '../UI/Modal';

export default function MessagesPage() {
  const { 
    user,
    users,
    messages,
    chatActiveContact,
    setChatActiveContact,
    sendMessage,
    markMessagesAsRead,
    getUserMessages,
    getUnreadMessagesCount,
    websocketConnected,
    isUserOnline,
    isUserTyping,
    startTyping,
    stopTyping
  } = useSecureApp();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Liste des contacts avec qui l'utilisateur a eu des conversations
  const getContacts = () => {
    if (!user) return [];
    
    const contactIds = new Set();
    messages.forEach(msg => {
      if (msg.senderId === user.id) {
        contactIds.add(msg.receiverId);
      } else if (msg.receiverId === user.id) {
        contactIds.add(msg.senderId);
      }
    });

    return Array.from(contactIds)
      .map(id => users.find(u => u.id === id))
      .filter(Boolean)
      .sort((a, b) => {
        const aLastMsg = getLastMessage(a.id);
        const bLastMsg = getLastMessage(b.id);
        if (!aLastMsg) return 1;
        if (!bLastMsg) return -1;
        return new Date(bLastMsg.timestamp) - new Date(aLastMsg.timestamp);
      });
  };

  const getLastMessage = (contactId) => {
    const contactMessages = getUserMessages(contactId);
    return contactMessages[0]; // Le plus récent
  };

  const contacts = getContacts();
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = chatActiveContact ? getUserMessages(chatActiveContact.id) : [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  useEffect(() => {
    if (chatActiveContact) {
      markMessagesAsRead(chatActiveContact.id);
    }
  }, [chatActiveContact, markMessagesAsRead]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !chatActiveContact) return;

    // Stop typing indicator when sending message
    stopTyping(chatActiveContact.id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    sendMessage(chatActiveContact.id, messageText.trim());
    setMessageText('');
  };

  const handleMessageTextChange = (e) => {
    const value = e.target.value;
    setMessageText(value);

    // Handle typing indicators
    if (chatActiveContact && websocketConnected) {
      if (value.trim() && value !== messageText) {
        startTyping(chatActiveContact.id);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
          stopTyping(chatActiveContact.id);
          typingTimeoutRef.current = null;
        }, 2000);
      } else if (!value.trim()) {
        stopTyping(chatActiveContact.id);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getContactStatus = (contact) => {
    if (websocketConnected && isUserOnline(contact.id)) {
      return 'online';
    }
    return 'offline';
  };

  const handleStartNewConversation = (selectedUser) => {
    setChatActiveContact(selectedUser);
    setShowNewConversationModal(false);
  };

  // Get users who are not already in conversation with current user
  const getAvailableUsers = () => {
    const contactIds = new Set(contacts.map(c => c.id));
    return users.filter(u => u.id !== user.id && !contactIds.has(u.id));
  };

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Sidebar des conversations */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header de la sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Messages
            </h2>
            {websocketConnected && (
              <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                <Circle className="w-2 h-2 fill-current" />
                <span>Temps réel</span>
              </div>
            )}
          </div>
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {contacts.length === 0 
                  ? 'Aucune conversation'
                  : 'Aucun résultat'
                }
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const lastMessage = getLastMessage(contact.id);
              const unreadCount = getUnreadMessagesCount(contact.id);
              const status = getContactStatus(contact);
              const isActive = chatActiveContact?.id === contact.id;

              return (
                <div
                  key={contact.id}
                  onClick={() => setChatActiveContact(contact)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isActive ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-r-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar avec statut */}
                    <div className="relative">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>

                    {/* Informations du contact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium truncate ${
                          isActive 
                            ? 'text-primary-900 dark:text-primary-100' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {contact.name}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatMessageTime(lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {lastMessage 
                            ? (lastMessage.senderId === user.id ? 'Vous: ' : '') + lastMessage.content
                            : 'Nouvelle conversation'
                          }
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col">
        {chatActiveContact ? (
          <>
            {/* Header du chat */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={chatActiveContact.avatar}
                    alt={chatActiveContact.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {chatActiveContact.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                      <span>{chatActiveContact.type}</span>
                      {websocketConnected && (
                        <span className="flex items-center space-x-1">
                          <Circle className={`w-2 h-2 ${getContactStatus(chatActiveContact) === 'online' ? 'text-green-500 fill-current' : 'text-gray-400 fill-current'}`} />
                          <span className="text-xs">
                            {getContactStatus(chatActiveContact) === 'online' ? 'En ligne' : 'Hors ligne'}
                          </span>
                        </span>
                      )}
                      {isUserTyping(chatActiveContact.id, chatActiveContact.id) && (
                        <span className="text-xs text-primary-600 italic">
                          En train d'écrire...
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions du chat */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Video size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {currentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="text-gray-400" size={32} />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Commencez une conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Envoyez un message à {chatActiveContact.name} pour démarrer la conversation.
                  </p>
                </div>
              ) : (
                currentMessages.reverse().map((message) => {
                  const isSent = message.senderId === user.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isSent ? 'order-1' : 'order-2'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isSent
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p
                          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                            isSent ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Paperclip size={20} />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={handleMessageTextChange}
                    placeholder="Tapez votre message..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Smile size={20} />
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className={`p-3 rounded-full transition-colors ${
                    messageText.trim()
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          // État vide - aucune conversation sélectionnée
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageSquare className="text-primary-600" size={40} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choisissez une conversation existante ou commencez-en une nouvelle.
              </p>
              <button
                onClick={() => setShowNewConversationModal(true)}
                className="btn-primary"
              >
                Nouvelle conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de nouvelle conversation */}
      <Modal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        title="Démarrer une nouvelle conversation"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Sélectionnez un utilisateur pour commencer une nouvelle conversation:
          </p>
          
          <div className="max-h-96 overflow-y-auto">
            {getAvailableUsers().length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">
                  Tous les utilisateurs disponibles sont déjà dans vos conversations.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {getAvailableUsers().map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartNewConversation(user)}
                    className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user.type}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowNewConversationModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}