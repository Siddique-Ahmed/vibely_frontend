import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { setNotifications, setUnreadCount, setUnreadMessageCount } from '../redux/slices/uiSlice';
import { useUnreadCount, useUnreadMessageCount } from '../hooks/useApi';
import { showToast } from '../components/Toast';
import { getSocketChatId, getSocketSenderId } from '../utils/socketChatId';

function getSocketBaseUrl() {
    const api = import.meta.env.VITE_API_URL || '';
    const marker = '/api/v1';
    const i = api.indexOf(marker);
    if (i !== -1) return api.slice(0, i).replace(/\/+$/, '') || window.location.origin;
    return api.replace(/\/+$/, '') || window.location.origin;
}

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
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
            const serverUrl = getSocketBaseUrl();
            console.log("🔌 Initializing socket connection to:", serverUrl);
            
            // Initialize socket connection
            const newSocket = io(serverUrl, {
                query: {
                    userId: String(user._id),
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
            });

            console.log("🔌 Socket instance created, waiting for connection...");
            setSocket(newSocket);

            // Emit setup when connected
            newSocket.on("connect", () => {
                newSocket.emit("setup", String(user._id));
                setIsConnected(true);
                console.log("✅ Socket READY - Connected with ID:", newSocket.id);
            });

            // Socket connection errors
            newSocket.on("connect_error", (error) => {
                console.error("❌ Socket connection error:", error);
                setIsConnected(false);
            });

            newSocket.on("disconnect", (reason) => {
                console.log("❌ Socket disconnected:", reason);
                setIsConnected(false);
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
            // Notification Received
            newSocket.on("notification received", (newNotification) => {
                console.log("🔔 [Socket] New notification received:", newNotification);
                
                const sender = newNotification.sender;
                let toastMessage = '';
                let toastIcon = null;

                switch (newNotification.type) {
                    case 'like':
                        toastMessage = 'liked your post';
                        break;
                    case 'comment':
                        toastMessage = 'commented on your post';
                        break;
                    case 'follow':
                        toastMessage = 'started following you';
                        break;
                    case 'mention':
                        toastMessage = 'mentioned you in a post';
                        break;
                    case 'post':
                        toastMessage = 'posted a new update';
                        break;
                    case 'message':
                        toastMessage = 'sent you a message';
                        break;
                    default:
                        toastMessage = newNotification.message || 'New notification';
                }

                // Show Toast
                showToast({
                    title: sender?.username || 'Vibely',
                    message: toastMessage,
                    type: newNotification.type || 'info', // Fallback to info if variant doesn't exist
                    sender: sender,
                    duration: 5000,
                    onClick: () => {
                        if (newNotification.type === 'message') {
                            window.location.href = `/messages?chatId=${newNotification.chat}`;
                        } else {
                            window.location.href = '/notifications';
                        }
                    }
                });

                // Invalidate notification queries
                queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
                queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
                
                // If it's a message type notification (rarely used via this channel), update chats too
                if (newNotification.type === 'message') {
                    queryClient.refetchQueries({ queryKey: ['chats'] });
                }
            });

            // Chat/Message Real-time updates
            newSocket.on("message received", (newMessage) => {
                console.log("💬 [Socket] Message received:", newMessage);
                
                const userId = String(user?._id);
                const senderId = newMessage.sender?._id || newMessage.sender;
                const messageChatId = newMessage.chat?._id || newMessage.chat;
                const isFromMe = String(senderId) === userId;

                const urlParams = new URLSearchParams(window.location.search);
                const activeChatIdInUrl = urlParams.get('chatId'); 
                const isCurrentlyViewingThisChat =
                    window.location.pathname === '/messages' &&
                    !!messageChatId &&
                    String(activeChatIdInUrl || '') === String(messageChatId);

                console.log(`🧐 Decision - isFromMe: ${isFromMe}, isViewing: ${isCurrentlyViewingThisChat}`);

                if (!isFromMe && !isCurrentlyViewingThisChat) {
                    console.log("📈 Incrementing unread count globally");
                    dispatch(setUnreadMessageCount((prev) => prev + 1));
                    
                    // Show toast if not on messages page
                    if (window.location.pathname !== '/messages') {
                        showToast({
                            title: newMessage.sender?.username || 'New Message',
                            message: newMessage.content || 'Sent an attachment',
                            type: 'message',
                            duration: 5000,
                            sender: newMessage.sender,
                            onClick: () => {
                                window.location.href = `/messages?chatId=${messageChatId}`;
                            }
                        });
                    }
                }

                // CRITICAL: Refetch/Invalidate chats and messages to ensure real-time UI updates
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                queryClient.invalidateQueries({ queryKey: ['unreadMessageCount'] });
                
                if (messageChatId) {
                    // Update the specific message list if we are in that chat
                    queryClient.invalidateQueries({ queryKey: ['messages', messageChatId], exact: false });
                }
            });

            newSocket.on("chat created", (newChat) => {
                console.log("🆕 Brand new chat created:", newChat);
                // Join the new room so we get messages for it
                newSocket.emit("join chat", String(newChat._id));
                // Refresh chats list
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                
                // Show toast for new chat if it's a DM and not from me
                const other = newChat.participants?.find(p => String(p._id || p) !== String(user?._id));
                if (other && !newChat.isGroup) {
                    showToast({
                        message: `${other.username || 'Someone'} started a conversation with you`,
                        type: 'message',
                        duration: 5000,
                        sender: other
                    });
                }
            });

            newSocket.on("message mutated", (data) => {
                console.log("🔄 Message mutation received:", data);
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                if (data.chatId) {
                    queryClient.invalidateQueries({ queryKey: ['messages', data.chatId] });
                } else if (data.message?.chat_id) {
                    queryClient.invalidateQueries({ queryKey: ['messages', data.message.chat_id] });
                }
            });

            newSocket.on("message seen", (data) => {
                console.log("👀 Message seen update:", data);
                if (String(data.userId) === String(user._id)) {
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
                setIsConnected(false);
            });

            return () => {
                newSocket.close();
                setSocket(null);
                setIsConnected(false);
            };
        } else {
            // Disconnect socket if user logs out
            if (socket) {
                socket.close();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
