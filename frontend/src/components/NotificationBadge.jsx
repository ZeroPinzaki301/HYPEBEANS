// components/NotificationBadge.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Badge } from 'react-bootstrap';
import { io } from 'socket.io-client';

const NotificationBadge = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const socket = io('https://hypebeans.onrender.com'); // Your backend URL

    const fetchPendingCount = async () => {
      try {
        const { data } = await axiosInstance.get('/orders/pending-count');
        setPendingCount(data.count);
      } catch (err) {
        console.error('Error fetching pending count:', err);
      }
    };

    // Initial fetch
    fetchPendingCount();

    // Listen to the correct event
    socket.on('pending-orders-updated', ({ count }) => {
      console.log('Pending count updated to:', count);
      setPendingCount(count);
    });

    // Clean up
    return () => {
      socket.disconnect();
    };
  }, []);

  if (!pendingCount) return null;

  return (
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
  );
};

export default NotificationBadge;
