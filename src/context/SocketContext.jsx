import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { setNotifications, setUnreadCount } from '../redux/slices/uiSlice';
import { showToast } from '../components/Toast';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useSelector((state) => state.auth);
    const { unreadCount } = useSelector((state) => state.ui);
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user) {
            // Extract base URL from VITE_API_URL (e.g., http://localhost:9000 from http://localhost:9000/api/v1)
            const serverUrl = import.meta.env.VITE_API_URL.split('/api/v1')[0];
            
            // Initialize socket connection
            const newSocket = io(serverUrl, {
                query: {
                    userId: user._id,
                },
            });

            setSocket(newSocket);

            // Emit setup when connected
            newSocket.on("connect", () => {
                newSocket.emit("setup", user._id);
                console.log("✅ Socket connected and setup complete");
            });

            // Listen for online users
            newSocket.on("get-online-users", (users) => {
                setOnlineUsers(users);
            });

            /**
             * Handle real-time notifications
             * When a post is liked, commented on, replied to, or someone follows
             */
            newSocket.on("notification received", (newNotification) => {
                console.log("🔔 New notification:", newNotification);
                
                // Build notification message based on type
                let toastMessage = '';
                const sender = newNotification.sender;

                switch (newNotification.type) {
                    case 'like':
                        toastMessage = 'liked your post';
                        break;
                    case 'comment':
                        toastMessage = 'commented on your post';
                        break;
                    case 'reply':
                        toastMessage = 'replied to your comment';
                        break;
                    case 'follow':
                        toastMessage = 'started following you';
                        break;
                    case 'mention':
                        toastMessage = 'mentioned you';
                        break;
                    case 'post':
                        toastMessage = 'posted something new';
                        break;
                    default:
                        toastMessage = 'sent you a notification';
                }

                // Show professional toast notification with profile picture
                showToast({
                    message: toastMessage,
                    type: newNotification.type,
                    duration: 5000,
                    sender: sender,
                    notificationType: newNotification.type,
                });

                // Update Redux state with new notification
                dispatch(setNotifications([newNotification]));
                
                // Increment unread count in Redux with numeric value (not function)
                dispatch(setUnreadCount(unreadCount + 1));

                // Invalidate queries to refetch data
                queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
                queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
            });

            /**
             * Handle online/offline status changes
             * When a user you follow comes online or goes offline
             */
            newSocket.on("user status changed", (statusUpdate) => {
                console.log("👥 User status changed:", statusUpdate);

                const { userId, username, status } = statusUpdate;

                if (status === 'online') {
                    // Show toast when a user you follow comes online
                    showToast({
                        message: `${username || 'A user'} came online 🟢`,
                        type: 'online',
                        duration: 3000,
                    });
                } else if (status === 'offline') {
                    // Optionally show offline status (commented for now to reduce noise)
                    console.log(`${username || 'A user'} went offline`);
                    showToast({
                        message: `${username || 'A user'} went offline 🔴`,
                        type: 'offline',
                        duration: 3000,
                    });
                }
            });

            // Handle disconnection
            newSocket.on("disconnect", () => {
                console.log("❌ Socket disconnected");
            });

            return () => {
                newSocket.close();
                setSocket(null);
            };
        } else {
            // Disconnect socket if user logs out
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user, dispatch]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
