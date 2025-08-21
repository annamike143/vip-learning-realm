// App State Context for VIP Learning Realm
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  theme: 'light',
  language: 'en',
  notifications: [],
  courseProgress: {},
  preferences: {
    autoplay: true,
    subtitles: false,
    playbackSpeed: 1,
    notifications: true
  },
  ui: {
    sidebarOpen: false,
    modalOpen: false,
    currentModal: null
  },
  error: null,
  online: true
};

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_THEME: 'SET_THEME',
  SET_LANGUAGE: 'SET_LANGUAGE',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  UPDATE_COURSE_PROGRESS: 'UPDATE_COURSE_PROGRESS',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_MODAL: 'SET_MODAL',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_ONLINE: 'SET_ONLINE',
  RESET_STATE: 'RESET_STATE'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };

    case ActionTypes.SET_LANGUAGE:
      return {
        ...state,
        language: action.payload
      };

    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          id: Date.now(),
          ...action.payload
        }]
      };

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };

    case ActionTypes.UPDATE_COURSE_PROGRESS:
      return {
        ...state,
        courseProgress: {
          ...state.courseProgress,
          [action.payload.courseId]: {
            ...state.courseProgress[action.payload.courseId],
            ...action.payload.progress
          }
        }
      };

    case ActionTypes.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      };

    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen
        }
      };

    case ActionTypes.SET_MODAL:
      return {
        ...state,
        ui: {
          ...state.ui,
          modalOpen: !!action.payload,
          currentModal: action.payload
        }
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ActionTypes.SET_ONLINE:
      return {
        ...state,
        online: action.payload
      };

    case ActionTypes.RESET_STATE:
      return {
        ...initialState,
        theme: state.theme,
        language: state.language
      };

    default:
      return state;
  }
}

// Create context
const AppStateContext = createContext();

// Provider component
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('vip-theme');
      const savedLanguage = localStorage.getItem('vip-language');
      const savedPreferences = localStorage.getItem('vip-preferences');

      if (savedTheme) {
        dispatch({ type: ActionTypes.SET_THEME, payload: savedTheme });
      }

      if (savedLanguage) {
        dispatch({ type: ActionTypes.SET_LANGUAGE, payload: savedLanguage });
      }

      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: ActionTypes.UPDATE_PREFERENCES, payload: preferences });
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('vip-theme', state.theme);
      localStorage.setItem('vip-language', state.language);
      localStorage.setItem('vip-preferences', JSON.stringify(state.preferences));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [state.theme, state.language, state.preferences]);

  // Monitor online status
  useEffect(() => {
    function handleOnline() {
      dispatch({ type: ActionTypes.SET_ONLINE, payload: true });
    }

    function handleOffline() {
      dispatch({ type: ActionTypes.SET_ONLINE, payload: false });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Action creators
  const actions = {
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setTheme: (theme) => dispatch({ type: ActionTypes.SET_THEME, payload: theme }),
    setLanguage: (language) => dispatch({ type: ActionTypes.SET_LANGUAGE, payload: language }),
    addNotification: (notification) => dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notification }),
    removeNotification: (id) => dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: id }),
    updateCourseProgress: (courseId, progress) => dispatch({ 
      type: ActionTypes.UPDATE_COURSE_PROGRESS, 
      payload: { courseId, progress } 
    }),
    updatePreferences: (preferences) => dispatch({ type: ActionTypes.UPDATE_PREFERENCES, payload: preferences }),
    toggleSidebar: () => dispatch({ type: ActionTypes.TOGGLE_SIDEBAR }),
    setModal: (modal) => dispatch({ type: ActionTypes.SET_MODAL, payload: modal }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    resetState: () => dispatch({ type: ActionTypes.RESET_STATE })
  };

  const value = {
    state,
    actions,
    // Convenience getters
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    theme: state.theme,
    language: state.language,
    notifications: state.notifications,
    courseProgress: state.courseProgress,
    preferences: state.preferences,
    ui: state.ui,
    error: state.error,
    online: state.online
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook to use app state
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// Custom hooks for specific state slices
export function useAuth() {
  const { user, isAuthenticated, loading, actions } = useAppState();
  return {
    user,
    isAuthenticated,
    loading,
    setUser: actions.setUser,
    setLoading: actions.setLoading
  };
}

export function useTheme() {
  const { theme, actions } = useAppState();
  return {
    theme,
    setTheme: actions.setTheme
  };
}

export function useNotifications() {
  const { notifications, actions } = useAppState();
  return {
    notifications,
    addNotification: actions.addNotification,
    removeNotification: actions.removeNotification
  };
}

export function usePreferences() {
  const { preferences, actions } = useAppState();
  return {
    preferences,
    updatePreferences: actions.updatePreferences
  };
}

export function useUI() {
  const { ui, actions } = useAppState();
  return {
    ui,
    toggleSidebar: actions.toggleSidebar,
    setModal: actions.setModal
  };
}

export function useError() {
  const { error, actions } = useAppState();
  return {
    error,
    setError: actions.setError,
    clearError: actions.clearError
  };
}

export default AppStateContext;
