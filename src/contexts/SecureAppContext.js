import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { demoUsers, demoOpportunities, demoMessages, demoEvents } from '../data/demoData';
import SecureApiService from '../services/secureApi';
import websocketService from '../services/websocketService';
import notificationService from '../services/notificationService';
import adminApi from '../services/adminApi';

const SecureAppContext = createContext();

const USER_TYPES = {
  PME: 'PME/Startup',
  EXPERT: 'Expert/Consultant',
  MENTOR: 'Mentor',
  INCUBATOR: 'Incubateur',
  INVESTOR: 'Investisseur',
  BANK: 'Institution Financière',
  PUBLIC: 'Organisme Public',
  TECH: 'Partenaire Tech'
};

const initialState = {
  user: null,
  isAuthenticated: false,
  currentView: 'landing',
  theme: 'light',
  language: 'fr',
  notifications: [],
  users: [],
  opportunities: [],
  opportunityFavorites: [],
  messages: [],
  events: [],
  eventRegistrations: [],
  loading: false,
  loadingStates: {
    login: false,
    register: false,
    users: false,
    opportunities: false,
    events: false,
    messages: false,
    sendMessage: false,
    profile: false
  },
  sidebarOpen: true,
  searchFilters: {
    userType: '',
    industry: '',
    location: '',
    keywords: ''
  },
  selectedProfile: null,
  chatActiveContact: null,
  favoriteProfiles: [],
  appliedOpportunities: [],
  myOpportunities: [],
  apiConnected: false,
  usingSecureMode: true,
  authError: null,
  websocketConnected: false,
  onlineUsers: [],
  typingUsers: {},
  notificationsCount: 0,
  realtimeNotifications: []
};

function secureAppReducer(state, action) {
  switch (action.type) {
    case 'SET_API_STATUS':
      return {
        ...state,
        apiConnected: action.payload.connected,
        usingSecureMode: action.payload.secure || false
      };
    
    case 'SET_AUTH_ERROR':
      return {
        ...state,
        authError: action.payload
      };
    
    case 'CLEAR_AUTH_ERROR':
      return {
        ...state,
        authError: null
      };
    
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload
      };
    
    case 'SET_OPPORTUNITIES':
      return {
        ...state,
        opportunities: action.payload
      };

    case 'SET_OPPORTUNITY_FAVORITES':
      return {
        ...state,
        opportunityFavorites: action.payload
      };

    case 'ADD_OPPORTUNITY_FAVORITE':
      return {
        ...state,
        opportunityFavorites: [...state.opportunityFavorites, action.payload]
      };

    case 'REMOVE_OPPORTUNITY_FAVORITE':
      return {
        ...state,
        opportunityFavorites: state.opportunityFavorites.filter(
          opportunityId => opportunityId !== action.payload
        )
      };
    
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload
      };
    
    case 'SET_EVENTS':
      return {
        ...state,
        events: action.payload
      };

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event => 
          event.id === action.payload.id ? action.payload : event
        )
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };

    case 'SET_EVENT_REGISTRATIONS':
      return {
        ...state,
        eventRegistrations: action.payload
      };

    case 'ADD_EVENT_REGISTRATION':
      return {
        ...state,
        eventRegistrations: [...state.eventRegistrations, action.payload]
      };

    case 'REMOVE_EVENT_REGISTRATION':
      return {
        ...state,
        eventRegistrations: state.eventRegistrations.filter(
          eventId => eventId !== action.payload
        )
      };
    
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        currentView: 'dashboard',
        authError: null
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        currentView: 'login',
        selectedProfile: null,
        chatActiveContact: null,
        authError: null,
        users: [],
        opportunities: [],
        messages: [],
        events: [],
        favoriteProfiles: [],
        appliedOpportunities: [],
        myOpportunities: []
      };
    
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload
      };
    
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light'
      };
    
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload
      };
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_LOADING_STATE':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.operation]: action.payload.loading
        }
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50)
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      };
    
    case 'UPDATE_SEARCH_FILTERS':
      return {
        ...state,
        searchFilters: { ...state.searchFilters, ...action.payload }
      };
    
    case 'SET_SELECTED_PROFILE':
      return {
        ...state,
        selectedProfile: action.payload
      };
    
    case 'SET_CHAT_ACTIVE_CONTACT':
      return {
        ...state,
        chatActiveContact: action.payload
      };
    
    case 'ADD_FAVORITE':
      return {
        ...state,
        favoriteProfiles: [...state.favoriteProfiles, action.payload]
      };
    
    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favoriteProfiles: state.favoriteProfiles.filter(id => id !== action.payload)
      };
    
    case 'SET_FAVORITES':
      return {
        ...state,
        favoriteProfiles: action.payload
      };
    
    case 'APPLY_TO_OPPORTUNITY':
      return {
        ...state,
        appliedOpportunities: [...state.appliedOpportunities, action.payload]
      };
    
    case 'CREATE_OPPORTUNITY':
      return {
        ...state,
        opportunities: [action.payload, ...state.opportunities],
        myOpportunities: [action.payload.id, ...state.myOpportunities]
      };

    case 'UPDATE_OPPORTUNITY':
      return {
        ...state,
        opportunities: state.opportunities.map(opp => 
          opp.id === action.payload.id ? action.payload : opp
        )
      };

    case 'DELETE_OPPORTUNITY':
      return {
        ...state,
        opportunities: state.opportunities.filter(opp => opp.id !== action.payload),
        myOpportunities: state.myOpportunities.filter(id => id !== action.payload)
      };
    
    case 'SEND_MESSAGE':
      const newMessage = {
        id: Date.now().toString(),
        senderId: state.user.id,
        receiverId: action.payload.receiverId,
        content: action.payload.content,
        timestamp: new Date().toISOString(),
        read: false
      };
      return {
        ...state,
        messages: [newMessage, ...state.messages]
      };
    
    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.receiverId === state.user.id && msg.senderId === action.payload
            ? { ...msg, read: true }
            : msg
        )
      };
    
    case 'SET_WEBSOCKET_STATUS':
      return {
        ...state,
        websocketConnected: action.payload
      };
    
    case 'SET_ONLINE_USERS':
      return {
        ...state,
        onlineUsers: action.payload
      };
    
    case 'ADD_ONLINE_USER':
      return {
        ...state,
        onlineUsers: [...state.onlineUsers, action.payload].filter((user, index, self) => 
          self.findIndex(u => u.id === user.id) === index
        )
      };
    
    case 'REMOVE_ONLINE_USER':
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter(user => user.id !== action.payload)
      };
    
    case 'SET_USER_TYPING':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: {
            ...state.typingUsers[action.payload.conversationId],
            [action.payload.userId]: action.payload.isTyping
          }
        }
      };
    
    case 'RECEIVE_MESSAGE':
      return {
        ...state,
        messages: [action.payload, ...state.messages]
      };
    
    case 'SET_NOTIFICATIONS_COUNT':
      return {
        ...state,
        notificationsCount: action.payload
      };
    
    case 'ADD_REALTIME_NOTIFICATION':
      return {
        ...state,
        realtimeNotifications: [action.payload, ...state.realtimeNotifications.slice(0, 49)],
        notificationsCount: state.notificationsCount + 1
      };
    
    case 'UPDATE_NOTIFICATIONS_COUNT':
      return {
        ...state,
        notificationsCount: Math.max(0, state.notificationsCount + action.payload)
      };
    
    case 'CLEAR_REALTIME_NOTIFICATIONS':
      return {
        ...state,
        realtimeNotifications: []
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        realtimeNotifications: state.realtimeNotifications.map(notification =>
          notification.id === action.payload ? { ...notification, read: true } : notification
        ),
        notificationsCount: Math.max(0, state.notificationsCount - 1)
      };
    
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    default:
      return state;
  }
}

export function SecureAppProvider({ children }) {
  const [state, dispatch] = useReducer(secureAppReducer, initialState);

  // Check authentication status and API connection on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is already authenticated
        console.log('🔍 Checking authentication...');
        const savedUser = SecureApiService.getCurrentUser();
        console.log('👤 Saved user:', savedUser);
        console.log('🔐 Is authenticated:', SecureApiService.isAuthenticated());
        
        if (savedUser && SecureApiService.isAuthenticated()) {
          console.log('✅ User is authenticated, dispatching LOGIN');
          dispatch({ type: 'LOGIN', payload: savedUser });
          
          // Check if user is admin and redirect to admin dashboard
          if (adminApi.checkAdminAccess(savedUser)) {
            dispatch({ type: 'SET_VIEW', payload: 'admin' });
          }
          
          console.log('📡 About to call loadInitialData...');
          await loadInitialData();
          
          // Initialize WebSocket for already authenticated user
          initializeWebSocket();
        } else {
          console.log('❌ User not authenticated, showing landing page');
          // No authentication found - ensure landing page is shown
          dispatch({ type: 'SET_VIEW', payload: 'landing' });
        }

        // Check API connection
        await checkApiConnection();
      } catch (error) {
        console.log('App initialization error:', error);
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkApiConnection = async () => {
    try {
      const health = await SecureApiService.healthCheck();
      if (health.status === 'OK') {
        dispatch({ type: 'SET_API_STATUS', payload: { connected: true, secure: true } });
      } else {
        dispatch({ type: 'SET_API_STATUS', payload: { connected: false, secure: false } });
      }
    } catch (error) {
      console.log('Secure API not available');
      dispatch({ type: 'SET_API_STATUS', payload: { connected: false, secure: false } });
    }
  };

  const loadInitialData = async () => {
    console.log('🚀 loadInitialData called');
    console.log('🔐 isAuthenticated:', SecureApiService.isAuthenticated());
    
    if (!SecureApiService.isAuthenticated()) {
      console.log('❌ Not authenticated, skipping loadInitialData');
      return;
    }

    const currentUser = SecureApiService.getCurrentUser();
    console.log('👤 Current user from SecureApi:', currentUser);
    
    if (!currentUser?.id) {
      console.log('❌ No user ID found, skipping loadInitialData');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'users', loading: true } });
      
      // Load users with pagination
      console.log('👥 Loading users...');
      const usersResponse = await SecureApiService.getUsers();
      console.log('👥 Users response:', usersResponse);
      
      // Handle both array response and object with users property
      const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse.users || []);
      console.log('👥 Users array:', users.length, 'users');
      dispatch({ type: 'SET_USERS', payload: users });

      // Load user's favorites
      console.log('🔍 Loading favorites for user:', currentUser.id);
      const favorites = await SecureApiService.getFavorites(currentUser.id);
      console.log('📋 Received favorites:', favorites);
      const favoriteIds = favorites.map(fav => fav.profile_id || fav.id);
      console.log('📋 Favorite IDs:', favoriteIds);
      dispatch({ type: 'SET_FAVORITES', payload: favoriteIds });

      // Load opportunities
      console.log('💼 Loading opportunities...');
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: true } });
      const opportunities = await SecureApiService.getOpportunities();
      console.log('💼 Opportunities loaded:', opportunities.length, 'opportunities');
      dispatch({ type: 'SET_OPPORTUNITIES', payload: opportunities });
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: false } });

      // Load events
      console.log('📅 Loading events...');
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: true } });
      const events = await SecureApiService.getEvents();
      console.log('📅 Events loaded:', events.length, 'events');
      dispatch({ type: 'SET_EVENTS', payload: events });
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: false } });

      // Load messages for current user
      console.log('📨 Loading messages...');
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'messages', loading: true } });
      try {
        const messages = await SecureApiService.getMessages(currentUser.id);
        console.log('📨 Messages loaded:', messages.length, 'messages');
        dispatch({ type: 'SET_MESSAGES', payload: messages });
      } catch (messagesError) {
        console.error('Error loading messages:', messagesError);
        // Continue with empty messages array
        dispatch({ type: 'SET_MESSAGES', payload: [] });
      }
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'messages', loading: false } });
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: false } });
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: false } });
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'messages', loading: false } });
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors du chargement des données',
        timestamp: new Date().toISOString()
      });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'users', loading: false } });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'login', loading: true } });
      dispatch({ type: 'CLEAR_AUTH_ERROR' });
      
      const response = await SecureApiService.login(email, password);
      
      if (response.success) {
        console.log('✅ Login successful, dispatching LOGIN');
        dispatch({ type: 'LOGIN', payload: response.user });
        
        // Check if user is admin and redirect to admin dashboard
        if (adminApi.checkAdminAccess(response.user)) {
          dispatch({ type: 'SET_VIEW', payload: 'admin' });
        }
        
        console.log('📡 Login - About to call loadInitialData...');
        await loadInitialData();
        
        // Initialize WebSocket connection
        initializeWebSocket();
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: `Bienvenue ${response.user.name} !`,
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Secure login error:', error);
      
      const errorMessage = error.message === 'Authentication required' 
        ? 'Session expirée, veuillez vous reconnecter'
        : error.message || 'Erreur de connexion';
        
      dispatch({ type: 'SET_AUTH_ERROR', payload: errorMessage });
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'login', loading: false } });
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'register', loading: true } });
      dispatch({ type: 'CLEAR_AUTH_ERROR' });
      
      const response = await SecureApiService.register(userData);
      
      if (response.success) {
        dispatch({ type: 'LOGIN', payload: response.user });
        
        // Check if user is admin and redirect to admin dashboard
        if (adminApi.checkAdminAccess(response.user)) {
          dispatch({ type: 'SET_VIEW', payload: 'admin' });
        }
        
        await loadInitialData();
        
        // Initialize WebSocket connection
        initializeWebSocket();
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Compte créé avec succès !',
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Secure register error:', error);
      
      const errorMessage = error.message || 'Erreur lors de la création du compte';
      dispatch({ type: 'SET_AUTH_ERROR', payload: errorMessage });
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'register', loading: false } });
    }
  };

  const logout = async () => {
    try {
      await SecureApiService.logout();
      
      // Disconnect WebSocket
      websocketService.disconnect();
      dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: false });
      dispatch({ type: 'SET_ONLINE_USERS', payload: [] });
      
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      addNotification({
        id: Date.now().toString(),
        type: 'info',
        message: 'Vous avez été déconnecté',
        timestamp: new Date().toISOString()
      });
    }
  };


  const loadUsers = async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'users', loading: true } });
      
      const response = await SecureApiService.getUsers(filters);
      dispatch({ type: 'SET_USERS', payload: response.users || [] });
      
    } catch (error) {
      console.error('Failed to load users:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors du chargement des utilisateurs',
        timestamp: new Date().toISOString()
      });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'users', loading: false } });
    }
  };

  // Utility functions
  const setView = (view) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
    }, 5000);
  };

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const updateSearchFilters = (filters) => {
    dispatch({ type: 'UPDATE_SEARCH_FILTERS', payload: filters });
    // Automatically reload users with new filters
    loadUsers({ ...state.searchFilters, ...filters });
  };

  const setSelectedProfile = (profile) => {
    dispatch({ type: 'SET_SELECTED_PROFILE', payload: profile });
  };

  const setChatActiveContact = (contact) => {
    dispatch({ type: 'SET_CHAT_ACTIVE_CONTACT', payload: contact });
  };

  // Helper functions (maintained for compatibility)
  const getFilteredUsers = () => {
    return state.users; // Filtering is now done server-side
  };

  const getRecommendedUsers = () => {
    if (!state.user) return [];
    
    return state.users
      .filter(user => user.id !== state.user.id)
      .filter(user => {
        if (state.user.type === USER_TYPES.PME) {
          return [USER_TYPES.EXPERT, USER_TYPES.MENTOR, USER_TYPES.INVESTOR, USER_TYPES.INCUBATOR].includes(user.type);
        }
        if (state.user.type === USER_TYPES.INVESTOR) {
          return [USER_TYPES.PME, USER_TYPES.INCUBATOR].includes(user.type);
        }
        return true;
      })
      .slice(0, 6);
  };

  const getMatchingScore = (user1, user2) => {
    let score = 0;
    if (user1.industry === user2.industry) score += 30;
    if (user1.location === user2.location) score += 20;
    if (user1.interests?.some(interest => user2.interests?.includes(interest))) score += 25;
    if (user1.stage === user2.targetStage) score += 25;
    return Math.min(score, 100);
  };

  const getUserMessages = (userId) => {
    return state.messages.filter(msg => 
      (msg.senderId === state.user.id && msg.receiverId === userId) ||
      (msg.senderId === userId && msg.receiverId === state.user.id)
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getUnreadMessagesCount = (userId) => {
    return state.messages.filter(msg => 
      msg.senderId === userId && 
      msg.receiverId === state.user.id && 
      !msg.read
    ).length;
  };

  // Favorites functionality with secure API
  const toggleFavorite = async (profileId) => {
    console.log('💖 toggleFavorite called with profileId:', profileId);
    console.log('👤 Current user:', state.user?.id);
    console.log('📋 Current favorites:', state.favoriteProfiles);

    if (!state.user?.id) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Vous devez être connecté pour gérer les favoris',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const isCurrentlyFavorite = state.favoriteProfiles.includes(profileId);
      console.log('❤️ Is currently favorite:', isCurrentlyFavorite);
      
      let response;
      if (isCurrentlyFavorite) {
        console.log('➖ Removing from favorites...');
        response = await SecureApiService.removeFavorite(state.user.id, profileId);
        if (response.success) {
          dispatch({ type: 'REMOVE_FAVORITE', payload: profileId });
          addNotification({
            id: Date.now().toString(),
            type: 'success',
            message: 'Profil retiré des favoris',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log('➕ Adding to favorites...');
        response = await SecureApiService.addFavorite(state.user.id, profileId);
        if (response.success) {
          dispatch({ type: 'ADD_FAVORITE', payload: profileId });
          addNotification({
            id: Date.now().toString(),
            type: 'success',
            message: 'Profil ajouté aux favoris',
            timestamp: new Date().toISOString()
          });
        }
      }

      console.log('📊 Toggle favorite response:', response);

      if (!response.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: response.error || 'Erreur lors de la gestion des favoris',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Toggle favorite error:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de la gestion des favoris',
        timestamp: new Date().toISOString()
      });
    }
  };

  const sendMessage = async (receiverId, content) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'sendMessage', loading: true } });
      
      const response = await SecureApiService.sendMessage(receiverId, content);
      
      if (response.success) {
        dispatch({ type: 'SEND_MESSAGE', payload: { receiverId, content } });
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Message envoyé',
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Send message error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de l\'envoi du message',
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'sendMessage', loading: false } });
    }
  };

  const markMessagesAsRead = (senderId) => {
    dispatch({ type: 'MARK_MESSAGES_READ', payload: senderId });
  };

  const applyToOpportunity = async (opportunityId, message = '') => {
    try {
      console.log('📝 Context - applyToOpportunity called:', { opportunityId, message });
      
      const response = await SecureApiService.applyToOpportunity(opportunityId, state.user.id, message);
      
      if (response.success) {
        dispatch({ type: 'APPLY_TO_OPPORTUNITY', payload: opportunityId });
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Candidature envoyée avec succès',
          timestamp: new Date().toISOString()
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Apply to opportunity error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de l\'envoi de la candidature',
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  };

  const createOpportunity = async (opportunityData) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: true } });
      
      const response = await SecureApiService.createOpportunity(opportunityData);
      
      // The response should directly be the opportunity object, not wrapped in success
      const newOpportunity = {
        ...response,
        authorId: state.user.id,
        applicants: response.applicants || 0
      };
      
      dispatch({ type: 'CREATE_OPPORTUNITY', payload: newOpportunity });
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Opportunité publiée avec succès',
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Create opportunity error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de la création de l\'opportunité',
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: false } });
    }
  };

  const updateOpportunity = async (opportunityId, opportunityData) => {
    try {
      console.log('🔄 Context - updateOpportunity called:', { opportunityId, opportunityData });
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: true } });
      
      const response = await SecureApiService.updateOpportunity(opportunityId, opportunityData);
      
      dispatch({ type: 'UPDATE_OPPORTUNITY', payload: response });
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Opportunité mise à jour avec succès',
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Update opportunity error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de la mise à jour de l\'opportunité',
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: false } });
    }
  };

  const deleteOpportunity = async (opportunityId) => {
    try {
      console.log('🗑️ Context - deleteOpportunity called:', opportunityId);
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: true } });
      
      await SecureApiService.deleteOpportunity(opportunityId);
      
      dispatch({ type: 'DELETE_OPPORTUNITY', payload: opportunityId });
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Opportunité supprimée avec succès',
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Delete opportunity error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de la suppression de l\'opportunité',
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: false } });
    }
  };

  const getUserOpportunities = async (userId) => {
    try {
      console.log('🔍 Context - getUserOpportunities called:', userId);
      const response = await SecureApiService.getUserOpportunities(userId);
      return response;
    } catch (error) {
      console.error('Get user opportunities error:', error);
      return [];
    }
  };

  const getOpportunityApplications = async (opportunityId) => {
    try {
      console.log('🔍 Context - getOpportunityApplications called:', opportunityId);
      const response = await SecureApiService.getOpportunityApplications(opportunityId);
      return response;
    } catch (error) {
      console.error('Get opportunity applications error:', error);
      return [];
    }
  };

  const loadOpportunityFavorites = async (userId) => {
    try {
      console.log('📋 Context - loadOpportunityFavorites called:', userId);
      const favorites = await SecureApiService.getOpportunityFavorites(userId);
      dispatch({ type: 'SET_OPPORTUNITY_FAVORITES', payload: favorites });
      return favorites;
    } catch (error) {
      console.error('Load opportunity favorites error:', error);
      return [];
    }
  };

  const addOpportunityToFavorites = async (opportunityId) => {
    try {
      console.log('➕ Context - addOpportunityToFavorites called:', opportunityId);
      const response = await SecureApiService.addOpportunityFavorite(state.user.id, opportunityId);
      
      if (response.success) {
        dispatch({ 
          type: 'ADD_OPPORTUNITY_FAVORITE', 
          payload: opportunityId 
        });
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Opportunité ajoutée aux favoris',
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Add opportunity to favorites error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de l\'ajout aux favoris',
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  };

  const removeOpportunityFromFavorites = async (opportunityId) => {
    try {
      console.log('🗑️ Context - removeOpportunityFromFavorites called:', opportunityId);
      const response = await SecureApiService.removeOpportunityFavorite(state.user.id, opportunityId);
      
      if (response.success) {
        dispatch({ 
          type: 'REMOVE_OPPORTUNITY_FAVORITE', 
          payload: opportunityId 
        });
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Opportunité supprimée des favoris',
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Remove opportunity from favorites error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de la suppression des favoris',
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  };

  const isOpportunityFavorite = (opportunityId) => {
    return state.opportunityFavorites.includes(opportunityId);
  };

  const createEvent = async (eventData) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: true } });
      
      const response = await SecureApiService.createEvent(eventData);
      
      if (response.success) {
        const newEvent = {
          id: response.event.id,
          ...eventData,
          organizer: state.user.name,
          createdAt: new Date().toISOString(),
          attendees: 0
        };
        dispatch({ type: 'SET_EVENTS', payload: [newEvent, ...state.events] });
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Événement créé avec succès',
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Create event error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de la création de l\'événement',
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: false } });
    }
  };

  const updateEvent = async (eventId, eventData) => {
    try {
      console.log('🔄 Context - updateEvent called:', { eventId, eventData });
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: true } });
      
      const response = await SecureApiService.updateEvent(eventId, eventData);
      
      dispatch({ type: 'UPDATE_EVENT', payload: response });
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Événement mis à jour avec succès',
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Update event error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de la mise à jour de l\'événement',
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: false } });
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      console.log('🗑️ Context - deleteEvent called:', eventId);
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: true } });
      
      await SecureApiService.deleteEvent(eventId);
      
      dispatch({ type: 'DELETE_EVENT', payload: eventId });
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Événement supprimé avec succès',
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Delete event error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de la suppression de l\'événement',
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: false } });
    }
  };

  const loadEventRegistrations = async (userId) => {
    try {
      console.log('📋 Context - loadEventRegistrations called:', userId);
      const response = await SecureApiService.getUserEventRegistrations(userId);
      dispatch({ type: 'SET_EVENT_REGISTRATIONS', payload: response.registrations || [] });
      return response.registrations || [];
    } catch (error) {
      console.error('Load event registrations error:', error);
      return [];
    }
  };

  const registerForEvent = async (eventId) => {
    try {
      console.log('📝 Context - registerForEvent called:', eventId);
      const response = await SecureApiService.registerForEvent(eventId, state.user.id);
      
      if (response.success) {
        dispatch({ 
          type: 'ADD_EVENT_REGISTRATION', 
          payload: eventId 
        });
        
        // Reload event registrations to ensure consistency
        loadEventRegistrations(state.user.id);
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Inscription réussie !',
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Register for event error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de l\'inscription',
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  };

  const unregisterFromEvent = async (eventId) => {
    try {
      console.log('🚫 Context - unregisterFromEvent called:', eventId);
      const response = await SecureApiService.unregisterFromEvent(eventId, state.user.id);
      
      if (response.success) {
        dispatch({ 
          type: 'REMOVE_EVENT_REGISTRATION', 
          payload: eventId 
        });
        
        // Reload event registrations to ensure consistency
        loadEventRegistrations(state.user.id);
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Désinscription réussie !',
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Unregister from event error:', error);
      
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Erreur lors de la désinscription',
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  };

  const isRegisteredForEvent = (eventId) => {
    return state.eventRegistrations.includes(eventId);
  };

  // WebSocket functions
  const initializeWebSocket = () => {
    if (!state.user || !SecureApiService.isAuthenticated()) return;
    
    const token = SecureApiService.getStoredToken();
    if (!token) return;

    try {
      websocketService.connect(token);
      dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: true });

      // Set up WebSocket event listeners
      websocketService.onNewMessage((message) => {
        dispatch({ type: 'RECEIVE_MESSAGE', payload: message });
        
        // Show notification if message is not from current chat
        if (state.chatActiveContact?.id !== message.senderId) {
          const sender = state.users.find(u => u.id === message.senderId);
          addNotification({
            id: Date.now().toString(),
            type: 'info',
            message: `Nouveau message de ${sender?.name || 'Utilisateur'}`,
            timestamp: new Date().toISOString()
          });
        }
      });

      websocketService.onMessageRead((data) => {
        dispatch({ type: 'MARK_MESSAGES_READ', payload: data.senderId });
      });

      websocketService.onUserTyping((data) => {
        dispatch({ 
          type: 'SET_USER_TYPING', 
          payload: { 
            conversationId: data.conversationId, 
            userId: data.userId, 
            isTyping: true 
          } 
        });
      });

      websocketService.onUserStoppedTyping((data) => {
        dispatch({ 
          type: 'SET_USER_TYPING', 
          payload: { 
            conversationId: data.conversationId, 
            userId: data.userId, 
            isTyping: false 
          } 
        });
      });

      websocketService.onOnlineUsers((users) => {
        dispatch({ type: 'SET_ONLINE_USERS', payload: users });
      });

      // Get initial online users
      websocketService.getOnlineUsers();

      // Initialize notification service
      notificationService.initialize();
      
      // Set up notification service listeners
      const unsubscribeNotifications = notificationService.subscribe((event, data) => {
        switch (event) {
          case 'new_notification':
            dispatch({ type: 'ADD_REALTIME_NOTIFICATION', payload: data });
            
            // Show browser notification if permission granted
            if (data.type !== 'message') {
              notificationService.showBrowserNotification(data.title, data.message, {
                tag: `notification_${data.id}`,
                icon: '/favicon.ico'
              });
            }
            break;
            
          case 'notification_read':
            dispatch({ type: 'MARK_NOTIFICATION_READ', payload: data.notificationId });
            break;
            
          case 'notifications_loaded':
            dispatch({ type: 'SET_NOTIFICATIONS_COUNT', payload: data.unreadCount || 0 });
            break;
            
          default:
            break;
        }
      });

      // Get initial notifications
      notificationService.getNotifications({ unreadOnly: true });

    } catch (error) {
      console.error('WebSocket initialization error:', error);
      dispatch({ type: 'SET_WEBSOCKET_STATUS', payload: false });
    }
  };

  // Override sendMessage to use WebSocket
  const sendMessageViaWebSocket = (receiverId, content) => {
    if (state.websocketConnected) {
      websocketService.sendMessage(receiverId, content);
    } else {
      // Fallback to the original method
      sendMessage(receiverId, content);
    }
  };

  // Override markMessagesAsRead to use WebSocket
  const markMessagesAsReadViaWebSocket = (senderId) => {
    if (state.websocketConnected) {
      websocketService.markMessagesAsRead(senderId);
    } else {
      // Fallback to the original method
      markMessagesAsRead(senderId);
    }
  };

  // Typing indicators
  const startTyping = (conversationId) => {
    if (state.websocketConnected) {
      websocketService.startTyping(conversationId);
    }
  };

  const stopTyping = (conversationId) => {
    if (state.websocketConnected) {
      websocketService.stopTyping(conversationId);
    }
  };

  // Check if user is typing
  const isUserTyping = (conversationId, userId) => {
    return state.typingUsers[conversationId]?.[userId] || false;
  };

  // Get online status
  const isUserOnline = (userId) => {
    return state.onlineUsers.some(user => user.id === userId);
  };

  // Notification functions
  const sendNotification = (targetUserId, title, message, type = 'info', data = {}) => {
    notificationService.sendNotification(targetUserId, title, message, type, data);
  };

  const sendConnectionRequest = (targetUserId) => {
    notificationService.sendConnectionRequest(targetUserId);
  };

  const sendOpportunityNotification = (opportunityId, targetUserId, action) => {
    notificationService.sendOpportunityNotification(opportunityId, targetUserId, action);
  };

  const markNotificationAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const getAllNotifications = () => {
    return notificationService.getAllNotifications();
  };

  const getUnreadNotificationsCount = () => {
    return state.notificationsCount;
  };

  const clearAllNotifications = () => {
    notificationService.clearNotifications();
    dispatch({ type: 'CLEAR_REALTIME_NOTIFICATIONS' });
    dispatch({ type: 'SET_NOTIFICATIONS_COUNT', payload: 0 });
  };

  const requestNotificationPermission = async () => {
    return await notificationService.requestNotificationPermission();
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'profile', loading: true } });
      
      const updatedUser = await SecureApiService.updateProfile(profileData);
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'profile', loading: false } });
    }
  };

  const value = {
    ...state,
    USER_TYPES,
    login,
    register,
    logout,
    setView,
    setCurrentView: setView, // Alias for compatibility
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    updateSearchFilters,
    setSelectedProfile,
    setChatActiveContact,
    toggleFavorite,
    sendMessage: sendMessageViaWebSocket,
    markMessagesAsRead: markMessagesAsReadViaWebSocket,
    applyToOpportunity,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    getUserOpportunities,
    getOpportunityApplications,
    loadOpportunityFavorites,
    addOpportunityToFavorites,
    removeOpportunityFromFavorites,
    isOpportunityFavorite,
    createEvent,
    updateEvent,
    deleteEvent,
    loadEventRegistrations,
    registerForEvent,
    unregisterFromEvent,
    isRegisteredForEvent,
    updateProfile,
    loadUsers,
    getFilteredUsers,
    getRecommendedUsers,
    getMatchingScore,
    getUserMessages,
    getUnreadMessagesCount,
    initializeWebSocket,
    startTyping,
    stopTyping,
    isUserTyping,
    isUserOnline,
    sendNotification,
    sendConnectionRequest,
    sendOpportunityNotification,
    markNotificationAsRead,
    getAllNotifications,
    getUnreadNotificationsCount,
    clearAllNotifications,
    requestNotificationPermission
  };

  return (
    <SecureAppContext.Provider value={value}>
      {children}
    </SecureAppContext.Provider>
  );
}

export const useSecureApp = () => {
  const context = useContext(SecureAppContext);
  if (!context) {
    throw new Error('useSecureApp must be used within a SecureAppProvider');
  }
  return context;
};