// components/NotificationBadge.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Badge } from 'react-bootstrap';
import { io } from 'socket.io-client';

const NotificationBadge = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('https://hypebeans.onrender.com', {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('pending-orders-updated', ({ count }) => {
      console.log('Received pending-orders-updated:', count);
      setPendingCount(count);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Initial fetch
    const fetchPendingCount = async () => {
      try {
        const { data } = await axiosInstance.get('/orders/pending-count');
        console.log('Initial pending count:', data.count);
        setPendingCount(data.count);
      } catch (err) {
        console.error('Error fetching pending count:', err);
        setError('Failed to load notifications');
      }
    };

    fetchPendingCount();

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Debugging logs
  useEffect(() => {
    console.log(`Current pending count: ${pendingCount}, Socket connected: ${isConnected}`);
  }, [pendingCount, isConnected]);

  if (error) {
    console.error(error);
    return null;
  }

  return (
    <>
      {pendingCount > 0 && (
        <Badge 
          pill 
          bg="danger"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            fontSize: '0.75rem',
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s infinite',
            zIndex: 1000
          }}
        >
          {pendingCount}
        </Badge>
      )}
    </>
  );
};

export default NotificationBadge;
