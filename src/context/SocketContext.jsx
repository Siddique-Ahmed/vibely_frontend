import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user } = useSelector((state) => state.auth);

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
            });

            // Listen for online users
            newSocket.on("get-online-users", (users) => {
                setOnlineUsers(users);
            });

            // Listen for notifications
            newSocket.on("notification received", (newNotification) => {
                console.log("New notification:", newNotification);
                // You can add toast notification logic here or dispatch a redux action
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
