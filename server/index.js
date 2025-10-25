const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

// Store users and channel messages
let users = [];
let channelMessages = {
    'level-0': [],
    'level-1': [],
    'level-2': [],
    'level-fun': []
};

// Serve static files từ client folder
app.use(express.static(path.join(__dirname, '../client')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // User joins
    socket.on('user-join', (data) => {
        const user = {
            id: socket.id,
            username: data.username,
            channel: data.channel || 'level-0',
            status: 'online'
        };
        
        users.push(user);
        socket.join(data.channel || 'level-0');
        
        // Send existing messages to new user
        if (channelMessages[data.channel || 'level-0']) {
            socket.emit('channel-history', channelMessages[data.channel || 'level-0']);
        }
        
        // Notify others
        socket.broadcast.emit('user-joined', {
            username: data.username
        });
        
        // Update users list
        io.emit('update-users', users);
    });
    
    // Send message
    socket.on('send-message', (data) => {
        // Save message to channel history
        if (channelMessages[data.channel]) {
            channelMessages[data.channel].push(data);
            
            // Keep only last 100 messages per channel
            if (channelMessages[data.channel].length > 100) {
                channelMessages[data.channel].shift();
            }
        }
        
        const messageData = {
            username: data.username,
            message: data.message,
            channel: data.channel,
            timestamp: data.timestamp || new Date().toISOString(),
            time: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        // Send to all users in the same channel
        io.to(data.channel).emit('receive-message', messageData);
    });
    
    // Typing indicators
    socket.on('typing-start', (data) => {
        socket.to(data.channel).emit('user-typing', data);
    });
    
    socket.on('typing-stop', (data) => {
        socket.to(data.channel).emit('user-stop-typing', data);
    });
    
    // Channel change
    socket.on('change-channel', (data) => {
        const user = users.find(u => u.id === socket.id);
        if (user) {
            // Leave old channel
            socket.leave(user.channel);
            
            // Join new channel
            socket.join(data.channel);
            user.channel = data.channel;
            
            // Send channel history to user
            if (channelMessages[data.channel]) {
                socket.emit('channel-history', channelMessages[data.channel]);
            }
            
            console.log(`User ${user.username} moved to ${data.channel}`);
        }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        const user = users.find(u => u.id === socket.id);
        if (user) {
            users = users.filter(u => u.id !== socket.id);
            
            socket.broadcast.emit('user-left', {
                username: user.username
            });
            
            io.emit('update-users', users);
            
            console.log('User disconnected:', user.username);
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
http.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, '../client')}`);
});