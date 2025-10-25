const socket = io('http://localhost:3000');

let currentUser = '';
let currentChannel = 'level-0';
let typingTimer;
let isTyping = false;
let messageHistory = {
    'level-0': [],
    'level-1': [],
    'level-2': [],
    'level-???????': []
};
// Time 
setInterval(() => {
    const now = new Date();
    const time = now.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = time;
    }
}, 1000);

// Login
function login() {
    const username = document.getElementById('usernameInput').value.trim();
    
    if (username === '') {
        alert('⚠ username required');
        return;
    }
    
    currentUser = username;
    
    // Play creepy sound effect (optional)
    playSound('enter');
    
    // Update UI with glitch effect
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'flex';
    document.getElementById('currentUsername').textContent = username;
    
    // Add glitch effect on transition
    document.body.style.animation = 'glitch-transition 0.5s';
    
    socket.emit('user-join', {
        username: username,
        channel: currentChannel
    });
    
    // Start sanity drain
    startSanityDrain();
}

// Sanity meter effect
function startSanityDrain() {
    let sanity = 100;
    setInterval(() => {
        sanity = Math.max(20, sanity - 0.5);
        const sanityBar = document.getElementById('sanityBar');
        if (sanityBar) {
            sanityBar.style.width = sanity + '%';
            if (sanity < 50) {
                sanityBar.style.background = 'linear-gradient(90deg, #d32f2f, #ff9800)';
            }
            if (sanity < 30) {
                document.body.style.filter = `contrast(${100 + (30-sanity)}%)`;
            }
        }
    }, 1000);
}

// Update action button based on input
document.getElementById('messageInput').addEventListener('input', function(e) {
    const actionBtn = document.getElementById('actionBtn');
    const actionIcon = document.getElementById('actionIcon');
    
    if (e.target.value.trim() !== '') {
        // Change to send button
        actionBtn.classList.add('send-mode');
        actionIcon.className = 'fas fa-paper-plane';
        actionBtn.onclick = sendMessage;
    } else {
        // Change back to emoji button
        actionBtn.classList.remove('send-mode');
        actionIcon.className = 'far fa-face-fearful';
        actionBtn.onclick = () => toggleEmojiPicker();
    }
    
    // Typing indicator
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing-start', {
            username: currentUser,
            channel: currentChannel
        });
    }
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(stopTyping, 2000);
});

// Toggle emoji or send
function toggleEmojiOrSend() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput.value.trim() !== '') {
        sendMessage();
    } else {
        toggleEmojiPicker();
    }
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message === '') return;
    
    const messageData = {
        username: currentUser,
        message: message,
        channel: currentChannel,
        timestamp: new Date().toISOString()
    };
    
    socket.emit('send-message', messageData);
    
    // Save to history
    if (!messageHistory[currentChannel]) {
        messageHistory[currentChannel] = [];
    }
    messageHistory[currentChannel].push(messageData);
    
    messageInput.value = '';
    
    // Reset button
    const actionBtn = document.getElementById('actionBtn');
    const actionIcon = document.getElementById('actionIcon');
    actionBtn.classList.remove('send-mode');
    actionIcon.className = 'far fa-face-fearful';
    actionBtn.onclick = () => toggleEmojiPicker();
    
    stopTyping();
}

// Stop typing
function stopTyping() {
    if (isTyping) {
        isTyping = false;
        socket.emit('typing-stop', {
            username: currentUser,
            channel: currentChannel
        });
    }
}

// Select channel
function selectChannel(channel) {
    // Save current channel messages
    const currentMessages = document.getElementById('messagesContainer').innerHTML;
    if (currentChannel && !currentMessages.includes('system-alert')) {
        messageHistory[currentChannel] = currentMessages;
    }
    
    currentChannel = channel;
    
    // Update UI
    document.querySelectorAll('.level-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.level-item').classList.add('active');
    
    // Update channel info
    const channelNames = {
        'level-0': 'LEVEL 0',
        'level-1': 'LEVEL 1', 
        'level-2': 'LEVEL 2',
        'level-???????': 'LEVEL ???????'
    };
    
    const channelDescriptions = {
        'level-0': 'The endless yellow rooms...',
        'level-1': 'Industrial darkness awaits...',
        'level-2': 'Pipe maze of nightmares...',
        'level-???????': '????????????????????????...'
    };
    
    document.getElementById('channelName').textContent = channelNames[channel];
    document.querySelector('.level-description').textContent = channelDescriptions[channel];
    
    // Load channel messages from history
    const messagesContainer = document.getElementById('messagesContainer');
    if (messageHistory[channel] && typeof messageHistory[channel] === 'string') {
        messagesContainer.innerHTML = messageHistory[channel];
    } else if (messageHistory[channel] && Array.isArray(messageHistory[channel])) {
        messagesContainer.innerHTML = '';
        messageHistory[channel].forEach(msg => {
            displayMessage(msg);
        });
    } else {
        messagesContainer.innerHTML = `
            <div class="system-alert">
                <p>⚠ ENTERING ${channelNames[channel]}</p>
                <p>Signal strength: ${Math.floor(Math.random() * 50 + 10)}%</p>
                <p>Entity detection: ACTIVE</p>
            </div>
        `;
    }
    
    // Emit channel change
    socket.emit('change-channel', {
        username: currentUser,
        channel: channel
    });
    
    // Add creepy effect for level-
    if (channel === 'level-???????') {
        document.body.style.animation = 'fun-distortion 0.5s infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 3000);
    }
}

// Display message
function displayMessage(data) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date(data.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${data.username}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${data.message}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Socket events
socket.on('receive-message', (data) => {
    if (data.channel !== currentChannel) {
        // Save message to history even if not in current channel
        if (!messageHistory[data.channel]) {
            messageHistory[data.channel] = [];
        }
        messageHistory[data.channel].push(data);
        return;
    }
    
    displayMessage(data);
    
    // Save to history
    if (!messageHistory[currentChannel]) {
        messageHistory[currentChannel] = [];
    }
    messageHistory[currentChannel].push(data);
});

// Typing indicator
socket.on('user-typing', (data) => {
    if (data.channel !== currentChannel || data.username === currentUser) return;
    
    const indicator = document.getElementById('typingIndicator');
    const typingText = indicator.querySelector('.typing-text');
    
    typingText.textContent = `${data.username} is transmitting...`;
    indicator.style.display = 'flex';
});

socket.on('user-stop-typing', (data) => {
    if (data.channel !== currentChannel) return;
    
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'none';
});

// Update users list
socket.on('update-users', (users) => {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'entity-item';
        userDiv.innerHTML = `
            <span class="entity-name">${user.username}</span>
            <span class="entity-status"></span>
        `;
        usersList.appendChild(userDiv);
    });
});

// User joined
socket.on('user-joined', (data) => {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.innerHTML = `⚠ Entity "${data.username}" has entered this level`;
    
    messagesContainer.appendChild(systemMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// User left
socket.on('user-left', (data) => {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.innerHTML = `⚠ Entity "${data.username}" has no-clipped out`;
    
    messagesContainer.appendChild(systemMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
}

function addEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value += emoji;
    messageInput.focus();
    
    // Update button to send mode
    const actionBtn = document.getElementById('actionBtn');
    const actionIcon = document.getElementById('actionIcon');
    actionBtn.classList.add('send-mode');
    actionIcon.className = 'fas fa-paper-plane';
    actionBtn.onclick = sendMessage;
    
    toggleEmojiPicker();
}

// Close emoji picker on outside click
document.addEventListener('click', function(e) {
    const emojiPicker = document.getElementById('emojiPicker');
    const actionBtn = document.getElementById('actionBtn');
    
    if (!emojiPicker.contains(e.target) && !actionBtn.contains(e.target)) {
        emojiPicker.style.display = 'none';
    }
});


document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            login();
        }
    });
});

// Optional: Play sound effects
function playSound(type) {
    // You can add sound effects here

}

setInterval(() => {
    if (Math.random() < 0.05) {
        document.body.style.filter = 'contrast(200%) brightness(150%)';
        setTimeout(() => {
            document.body.style.filter = '';
        }, 100);
    }
}, 10000);