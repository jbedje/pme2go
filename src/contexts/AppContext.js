import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { demoUsers, demoOpportunities, demoMessages, demoEvents } from '../data/demoData';

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
  currentView: 'dashboard',
  theme: 'light',
  language: 'fr',
  notifications: [],
  users: demoUsers,
  opportunities: demoOpportunities,
  messages: demoMessages,
  events: demoEvents,
  loading: false,
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
  myOpportunities: []
};

function appReducer(state, action) {
  switch (action.type) {
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
        currentView: 'login',
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

  const login = (email, password) => {
    const user = state.users.find(u => u.email === email);
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: `Bienvenue ${user.name} !`,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  };

  const register = (userData) => {
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      avatar: `https://ui-avatars.com/api/?name=${userData.name}&background=3b82f6&color=fff`,
      createdAt: new Date().toISOString(),
      verified: false,
      stats: {
        connections: 0,
        projects: 0,
        rating: 0,
        reviews: 0
      }
    };
    
    const updatedUsers = [...state.users, newUser];
    dispatch({ type: 'UPDATE_USERS', payload: updatedUsers });
    dispatch({ type: 'LOGIN', payload: newUser });
    
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Compte créé avec succès !',
      timestamp: new Date().toISOString()
    });
    
    return true;
  };

  const logout = () => {
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

  const toggleFavorite = (profileId) => {
    if (state.favoriteProfiles.includes(profileId)) {
      dispatch({ type: 'REMOVE_FAVORITE', payload: profileId });
    } else {
      dispatch({ type: 'ADD_FAVORITE', payload: profileId });
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: 'Profil ajouté aux favoris',
        timestamp: new Date().toISOString()
      });
    }
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

  const createOpportunity = (opportunityData) => {
    const newOpportunity = {
      id: Date.now().toString(),
      ...opportunityData,
      authorId: state.user.id,
      createdAt: new Date().toISOString(),
      applicants: []
    };
    dispatch({ type: 'CREATE_OPPORTUNITY', payload: newOpportunity });
    addNotification({
      id: Date.now().toString(),
      type: 'success',
      message: 'Opportunité publiée avec succès',
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

  const sendMessage = (receiverId, content) => {
    dispatch({ type: 'SEND_MESSAGE', payload: { receiverId, content } });
  };

  const markMessagesAsRead = (senderId) => {
    dispatch({ type: 'MARK_MESSAGES_READ', payload: senderId });
  };

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
    applyToOpportunity,
    createOpportunity,
    updateProfile,
    sendMessage,
    markMessagesAsRead,
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