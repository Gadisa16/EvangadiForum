import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { userProvider } from './UserProvider';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { isAuthenticated, user } = useContext(userProvider);

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:3000', {
        withCredentials: true
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        newSocket.emit('join', user.userid);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
}; 