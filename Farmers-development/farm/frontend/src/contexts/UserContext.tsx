import React, { createContext, useContext, useState, useCallback } from 'react';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  role?: string;
  preferences?: Record<string, unknown>;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  clearUser: () => void;
  /** Call this to log the user out (clears auth token + user state) */
  onLogout: (() => void) | null;
  setLogoutHandler: (fn: () => void) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [logoutHandler, setLogoutHandlerState] = useState<(() => void) | null>(null);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
  }, []);

  const clearUser = useCallback(() => {
    setCurrentUserState(null);
  }, []);

  const setLogoutHandler = useCallback((fn: () => void) => {
    // Wrap in a function so React doesn't call it immediately (state setter quirk)
    setLogoutHandlerState(() => fn);
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        clearUser,
        onLogout: logoutHandler,
        setLogoutHandler,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
