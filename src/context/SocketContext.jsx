import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { setNotifications, setUnreadCount, setUnreadMessageCount } from '../redux/slices/uiSlice';
import { useUnreadCount, useUnreadMessageCount } from '../hooks/useApi';
import { showToast } from '../components/Toast';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { data: unreadMsgData } = useUnreadMessageCount(!!user); // Only fetch when authenticated

    // Sync initial unread counts from API to Redux
    useEffect(() => {
        if (unreadMsgData?.data?.unreadMessageCount != null) {
            dispatch(setUnreadMessageCount(unreadMsgData.data.unreadMessageCount));
        }
    }, [unreadMsgData?.data?.unreadMessageCount, dispatch]);

    useEffect(() => {
        if (user) {
            // Extract base URL from VITE_API_URL (e.g., http://localhost:9000 from http://localhost:9000/api/v1)
            const serverUrl = import.meta.env.VITE_API_URL.split('/api/v1')[0];
            console.log("🔌 Connecting socket to:", serverUrl);
            
            // Initialize socket connection
            const newSocket = io(serverUrl, {
                query: {
                    userId: user._id,
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
            });

            setSocket(newSocket);

            // Emit setup when connected
            newSocket.on("connect", () => {
                newSocket.emit("setup", user._id);
                console.log("✅ Socket connected and setup complete with ID:", newSocket.id);
            });

            // Socket connection errors
            newSocket.on("connect_error", (error) => {
                console.error("❌ Socket connection error:", error);
            });

            newSocket.on("disconnect", (reason) => {
                console.log("❌ Socket disconnected:", reason);
            });

            // DEBUG: Listen to all socket events
            newSocket.onAny((eventName, ...args) => {
                if (!eventName.includes('ping') && !eventName.includes('pong')) {
                    console.log(`📡 [Socket Event] ${eventName}:`, args);
                }
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
                
                // Increment unread count in Redux using a functional update
                dispatch(setUnreadCount((prevCount) => prevCount + 1));

                queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
                queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
            });

            /**
             * Handle real-time messages globally
             */
            newSocket.on("message received", (newMessage) => {
                console.log("📩 Global message received:", newMessage);

                const senderId = String(newMessage.sender?._id || newMessage.sender);
                const userId = String(user?._id);
                const messageChatId = String(newMessage.chat_id || newMessage.chat);
                
                console.log(`🔍 Comparing IDs - Sender: ${senderId}, Me: ${userId}`);
                
                // 1. Don't increment if I am the sender
                const isFromMe = senderId === userId;
                
                // 2. Don't increment if I am currently looking at this specific chat
                const urlParams = new URLSearchParams(window.location.search);
                const activeChatIdInUrl = urlParams.get('chatId'); 
                const isCurrentlyViewingThisChat = window.location.pathname === '/messages' && activeChatIdInUrl === messageChatId;

                console.log(`🧐 Decision - isFromMe: ${isFromMe}, isViewing: ${isCurrentlyViewingThisChat}`);

                if (!isFromMe && !isCurrentlyViewingThisChat) {
                    console.log("📈 Incrementing unread count globally");
                    dispatch(setUnreadMessageCount((prev) => prev + 1));
                    
                    // Show toast if not on messages page
                    if (window.location.pathname !== '/messages') {
                        showToast({
                            message: `New message from ${newMessage.sender?.username || 'someone'}`,
                            type: 'message',
                            duration: 4000,
                            sender: newMessage.sender,
                        });
                    }
                }

                // Invalidate relevant queries
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                queryClient.invalidateQueries({ queryKey: ['unreadMessageCount'] });
                queryClient.invalidateQueries({ queryKey: ['messages', messageChatId] });
            });

            newSocket.on("message seen", (data) => {
                console.log("👀 Message seen update:", data);
                if (data.userId === user._id) {
                    // If I am the one who saw it, my unread count should decrease
                    queryClient.invalidateQueries({ queryKey: ['unreadMessageCount'] });
                }
                queryClient.invalidateQueries({ queryKey: ['chats'] });
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
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
