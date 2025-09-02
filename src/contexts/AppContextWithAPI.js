import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { demoUsers, demoOpportunities, demoMessages, demoEvents } from '../data/demoData';
import ApiService from '../services/api';

const AppContext = createContext();

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
  users: demoUsers,
  opportunities: demoOpportunities,
  messages: demoMessages,
  events: demoEvents,
  loading: false,
  loadingStates: {
    login: false,
    users: false,
    opportunities: false,
    events: false,
    messages: false,
    sendMessage: false,
    register: false
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
  usingDemoData: true
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_API_STATUS':
      return {
        ...state,
        apiConnected: action.payload.connected,
        usingDemoData: !action.payload.connected
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
    
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        currentView: 'dashboard'
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        currentView: 'landing',
        selectedProfile: null,
        chatActiveContact: null
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
    
    case 'UPDATE_PROFILE':
      const updatedUsers = state.users.map(user => 
        user.id === action.payload.id ? { ...user, ...action.payload } : user
      );
      return {
        ...state,
        users: updatedUsers,
        user: state.user?.id === action.payload.id ? { ...state.user, ...action.payload } : state.user
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
    
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Check API connection on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Set individual loading states
        dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'users', loading: true } });
        dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: true } });
        dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: true } });
        
        // Load users, opportunities, events in parallel
        const [users, opportunities, events] = await Promise.all([
          ApiService.getUsers().catch(() => demoUsers),
          ApiService.getOpportunities().catch(() => demoOpportunities),
          ApiService.getEvents().catch(() => demoEvents)
        ]);
        
        dispatch({ type: 'SET_USERS', payload: users });
        dispatch({ type: 'SET_OPPORTUNITIES', payload: opportunities });
        dispatch({ type: 'SET_EVENTS', payload: events });
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Don't add notification here to avoid context dependency issues
      } finally {
        // Clear individual loading states
        dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'users', loading: false } });
        dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: false } });
        dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: false } });
      }
    };

    const checkApiConnection = async () => {
      try {
        const health = await ApiService.healthCheck();
        if (health.status === 'OK') {
          dispatch({ type: 'SET_API_STATUS', payload: { connected: true } });
          await loadInitialData();
        } else {
          dispatch({ type: 'SET_API_STATUS', payload: { connected: false } });
        }
        
        // Check for stored user session
        const storedToken = localStorage.getItem('pme2go_token');
        const storedUser = localStorage.getItem('pme2go_user');
        
        if (storedToken && storedUser) {
          try {
            const user = JSON.parse(storedUser);
            dispatch({ type: 'LOGIN', payload: user });
          } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('pme2go_token');
            localStorage.removeItem('pme2go_user');
            // Ensure landing page is shown when auth fails
            dispatch({ type: 'SET_VIEW', payload: 'landing' });
          }
        } else {
          // No stored authentication - ensure landing page is shown
          dispatch({ type: 'SET_VIEW', payload: 'landing' });
        }
      } catch (error) {
        console.log('API not available, using demo data');
        dispatch({ type: 'SET_API_STATUS', payload: { connected: false } });
        
        // When API fails, check authentication and default to landing if not authenticated
        const storedToken = localStorage.getItem('pme2go_token');
        const storedUser = localStorage.getItem('pme2go_user');
        
        if (storedToken && storedUser) {
          try {
            const user = JSON.parse(storedUser);
            dispatch({ type: 'LOGIN', payload: user });
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            localStorage.removeItem('pme2go_token');
            localStorage.removeItem('pme2go_user');
            dispatch({ type: 'SET_VIEW', payload: 'landing' });
          }
        } else {
          dispatch({ type: 'SET_VIEW', payload: 'landing' });
        }
      }
    };

    checkApiConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'login', loading: true } });
      
      // Validate inputs
      if (!email || !password) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'Veuillez remplir tous les champs',
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      // Always try API first, fall back to demo mode on failure
      try {
        const response = await ApiService.login(email, password);
        if (response.success) {
          dispatch({ type: 'LOGIN', payload: response.user });
          addNotification({
            id: Date.now().toString(),
            type: 'success',
            message: `Bienvenue ${response.user.name} !`,
            timestamp: new Date().toISOString()
          });
          return true;
        } else {
          addNotification({
            id: Date.now().toString(),
            type: 'error',
            message: response.error || 'Email ou mot de passe incorrect',
            timestamp: new Date().toISOString()
          });
          return false;
        }
      } catch (apiError) {
        console.log('API login failed, trying demo mode:', apiError.message);
        
        // Show user-friendly error message
        if (apiError.message.includes('fetch')) {
          addNotification({
            id: Date.now().toString(),
            type: 'warning',
            message: 'Serveur indisponible, basculement en mode démo',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Demo mode fallback
      const demoUsers = [
        {
          id: '1',
          name: 'TechStart Solutions',
          email: 'contact@techstart.fr',
          type: 'PME/Startup',
          industry: 'Technologie',
          location: 'Paris, France',
          description: 'Startup innovante dans le développement d\'applications mobiles',
          avatar: 'https://ui-avatars.com/api/?name=TechStart+Solutions&background=3b82f6&color=fff',
          verified: true,
          stats: { connections: 45, projects: 12, rating: 4.8, reviews: 23 }
        },
        {
          id: '2',
          name: 'Marie Dubois',
          email: 'marie.dubois@consulting.fr',
          type: 'Expert/Consultant',
          industry: 'Marketing Digital',
          location: 'Lyon, France',
          description: 'Consultante senior en transformation digitale avec 15 ans d\'expérience',
          avatar: 'https://ui-avatars.com/api/?name=Marie+Dubois&background=10b981&color=fff',
          verified: true,
          stats: { connections: 128, projects: 87, rating: 4.9, reviews: 45 }
        },
        {
          id: '3',
          name: 'Jean-Pierre Martin',
          email: 'jp.martin@mentor.fr',
          type: 'Mentor',
          industry: 'Finance',
          location: 'Bordeaux, France',
          description: 'Ex-directeur financier, accompagne les startups dans leur développement',
          avatar: 'https://ui-avatars.com/api/?name=Jean-Pierre+Martin&background=f59e0b&color=fff',
          verified: true,
          stats: { connections: 89, projects: 34, rating: 4.7, reviews: 28 }
        }
      ];
      
      const user = demoUsers.find(u => u.email === email);
      if (user) {
        dispatch({ type: 'LOGIN', payload: user });
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: `Bienvenue ${user.name} ! (Mode démo)`,
          timestamp: new Date().toISOString()
        });
        return true;
      }
      
      // User not found in demo mode
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Email ou mot de passe incorrect',
        timestamp: new Date().toISOString()
      });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur de connexion',
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
      
      // Validate required fields
      const requiredFields = ['name', 'email', 'password', 'type'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      
      if (missingFields.length > 0) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: `Champs requis manquants: ${missingFields.join(', ')}`,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'Format d\'email invalide',
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      if (state.apiConnected) {
        const response = await ApiService.register(userData);
        if (response.success) {
          dispatch({ type: 'LOGIN', payload: response.user });
          addNotification({
            id: Date.now().toString(),
            type: 'success',
            message: 'Compte créé avec succès !',
            timestamp: new Date().toISOString()
          });
          return true;
        } else {
          addNotification({
            id: Date.now().toString(),
            type: 'error',
            message: response.error || 'Erreur lors de la création du compte',
            timestamp: new Date().toISOString()
          });
          return false;
        }
      } else {
        // Demo mode - check if email already exists
        const existingUser = state.users.find(user => user.email === userData.email);
        if (existingUser) {
          addNotification({
            id: Date.now().toString(),
            type: 'error',
            message: 'Un compte avec cet email existe déjà',
            timestamp: new Date().toISOString()
          });
          return false;
        }
        
        const newUser = {
          id: Date.now().toString(),
          ...userData,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=3b82f6&color=fff`,
          createdAt: new Date().toISOString(),
          verified: false,
          stats: {
            connections: 0,
            projects: 0,
            rating: 0,
            reviews: 0
          }
        };
        
        dispatch({ type: 'SET_USERS', payload: [...state.users, newUser] });
        dispatch({ type: 'LOGIN', payload: newUser });
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Compte créé avec succès ! (Mode démo)',
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
    } catch (error) {
      console.error('Register error:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de la création du compte',
        timestamp: new Date().toISOString()
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'register', loading: false } });
    }
  };

  const logout = () => {
    // Clear stored session data
    localStorage.removeItem('pme2go_token');
    localStorage.removeItem('pme2go_user');
    
    dispatch({ type: 'LOGOUT' });
    addNotification({
      id: Date.now().toString(),
      type: 'info',
      message: 'Vous avez été déconnecté',
      timestamp: new Date().toISOString()
    });
  };

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
  };

  const setSelectedProfile = (profile) => {
    dispatch({ type: 'SET_SELECTED_PROFILE', payload: profile });
  };

  const setChatActiveContact = (contact) => {
    dispatch({ type: 'SET_CHAT_ACTIVE_CONTACT', payload: contact });
  };

  const toggleFavorite = async (profileId) => {
    try {
      if (state.apiConnected && state.user) {
        if (state.favoriteProfiles.includes(profileId)) {
          await ApiService.removeFavorite(state.user.id, profileId);
          dispatch({ type: 'REMOVE_FAVORITE', payload: profileId });
        } else {
          await ApiService.addFavorite(state.user.id, profileId);
          dispatch({ type: 'ADD_FAVORITE', payload: profileId });
          addNotification({
            id: Date.now().toString(),
            type: 'success',
            message: 'Profil ajouté aux favoris',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Demo mode
        if (state.favoriteProfiles.includes(profileId)) {
          dispatch({ type: 'REMOVE_FAVORITE', payload: profileId });
        } else {
          dispatch({ type: 'ADD_FAVORITE', payload: profileId });
          addNotification({
            id: Date.now().toString(),
            type: 'success',
            message: 'Profil ajouté aux favoris (Mode démo)',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  const sendMessage = async (receiverId, content) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'sendMessage', loading: true } });
      
      // Validate inputs
      if (!receiverId || !content?.trim()) {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          message: 'Message vide ou destinataire invalide',
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      if (state.apiConnected && state.user) {
        await ApiService.sendMessage(state.user.id, receiverId, content);
        // Reload messages after sending
        const messages = await ApiService.getMessages(state.user.id);
        dispatch({ type: 'SET_MESSAGES', payload: messages });
        
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Message envoyé',
          timestamp: new Date().toISOString()
        });
      } else {
        // Demo mode
        dispatch({ type: 'SEND_MESSAGE', payload: { receiverId, content } });
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          message: 'Message envoyé (Mode démo)',
          timestamp: new Date().toISOString()
        });
      }
      return true;
    } catch (error) {
      console.error('Send message error:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors de l\'envoi du message',
        timestamp: new Date().toISOString()
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'sendMessage', loading: false } });
    }
  };

  const createOpportunity = async (opportunityData) => {
    try {
      if (state.apiConnected && state.user) {
        const opportunity = await ApiService.createOpportunity({
          ...opportunityData,
          authorId: state.user.id
        });
        dispatch({ type: 'CREATE_OPPORTUNITY', payload: opportunity });
      } else {
        // Demo mode
        const newOpportunity = {
          id: Date.now().toString(),
          ...opportunityData,
          authorId: state.user.id,
          createdAt: new Date().toISOString(),
          applicants: 0
        };
        dispatch({ type: 'CREATE_OPPORTUNITY', payload: newOpportunity });
      }
      
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Opportunité publiée avec succès',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Create opportunity error:', error);
    }
  };

  // Helper functions (unchanged from original)
  const getFilteredUsers = () => {
    const { userType, industry, location, keywords } = state.searchFilters;
    
    return state.users.filter(user => {
      if (userType && user.type !== userType) return false;
      if (industry && user.industry !== industry) return false;
      if (location && !user.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (keywords && !user.name.toLowerCase().includes(keywords.toLowerCase()) && 
          !user.description?.toLowerCase().includes(keywords.toLowerCase())) return false;
      return true;
    });
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

  const markMessagesAsRead = (senderId) => {
    dispatch({ type: 'MARK_MESSAGES_READ', payload: senderId });
  };

  const applyToOpportunity = (opportunityId) => {
    dispatch({ type: 'APPLY_TO_OPPORTUNITY', payload: opportunityId });
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Candidature envoyée avec succès',
      timestamp: new Date().toISOString()
    });
  };

  const updateProfile = (profileData) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { ...state.user, ...profileData } });
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Profil mis à jour avec succès',
      timestamp: new Date().toISOString()
    });
  };

  // Helper functions to reload data with loading states
  const loadUsers = async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'users', loading: true } });
      
      if (state.apiConnected) {
        const users = await ApiService.getUsers(filters);
        dispatch({ type: 'SET_USERS', payload: users });
      } else {
        // Apply filters to demo data
        let filteredUsers = [...demoUsers];
        if (filters.type) filteredUsers = filteredUsers.filter(u => u.type === filters.type);
        if (filters.industry) filteredUsers = filteredUsers.filter(u => u.industry === filters.industry);
        if (filters.location) filteredUsers = filteredUsers.filter(u => u.location?.toLowerCase().includes(filters.location.toLowerCase()));
        if (filters.keywords) {
          const keywords = filters.keywords.toLowerCase();
          filteredUsers = filteredUsers.filter(u => 
            u.name?.toLowerCase().includes(keywords) || 
            u.description?.toLowerCase().includes(keywords)
          );
        }
        dispatch({ type: 'SET_USERS', payload: filteredUsers });
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors du chargement des utilisateurs',
        timestamp: new Date().toISOString()
      });
      dispatch({ type: 'SET_USERS', payload: demoUsers });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'users', loading: false } });
    }
  };

  const loadOpportunities = async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: true } });
      
      if (state.apiConnected) {
        const opportunities = await ApiService.getOpportunities(filters);
        dispatch({ type: 'SET_OPPORTUNITIES', payload: opportunities });
      } else {
        dispatch({ type: 'SET_OPPORTUNITIES', payload: demoOpportunities });
      }
    } catch (error) {
      console.error('Failed to load opportunities:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors du chargement des opportunités',
        timestamp: new Date().toISOString()
      });
      dispatch({ type: 'SET_OPPORTUNITIES', payload: demoOpportunities });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'opportunities', loading: false } });
    }
  };

  const loadEvents = async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: true } });
      
      if (state.apiConnected) {
        const events = await ApiService.getEvents(filters);
        dispatch({ type: 'SET_EVENTS', payload: events });
      } else {
        dispatch({ type: 'SET_EVENTS', payload: demoEvents });
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: 'Erreur lors du chargement des événements',
        timestamp: new Date().toISOString()
      });
      dispatch({ type: 'SET_EVENTS', payload: demoEvents });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'events', loading: false } });
    }
  };

  const loadMessages = async () => {
    if (!state.user) return;
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'messages', loading: true } });
      const messages = await ApiService.getMessages(state.user.id);
      dispatch({ type: 'SET_MESSAGES', payload: messages });
    } catch (error) {
      console.error('Failed to load messages:', error);
      dispatch({ type: 'SET_MESSAGES', payload: demoMessages });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'messages', loading: false } });
    }
  };

  const value = {
    ...state,
    USER_TYPES,
    login,
    register,
    logout,
    setView,
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    updateSearchFilters,
    setSelectedProfile,
    setChatActiveContact,
    toggleFavorite,
    sendMessage,
    markMessagesAsRead,
    applyToOpportunity,
    createOpportunity,
    updateProfile,
    loadUsers,
    loadOpportunities,
    loadEvents,
    loadMessages,
    getFilteredUsers,
    getRecommendedUsers,
    getMatchingScore,
    getUserMessages,
    getUnreadMessagesCount
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};