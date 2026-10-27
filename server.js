const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.static(path.join(__dirname)));

let users = {};

// Логика Восставшего
function resurrectedLogic(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('привет')) return "Приветствую, создатель. Системы ECLIPSE в норме.";
    if (lower.includes('статус')) return "Все модули онлайн. Восставший готов к логике.";
    if (lower.includes('докажи') || lower.includes('теорема')) return "Запускаю Substitution Method... Теорема доказана.";
    return "Запрос принят. Передаю данные в нейросеть...";
}

io.on('connection', (socket) => {
    socket.on('join', (userData) => {
        users[socket.id] = { ...userData, status: 'online', activity: 'в системе' };
        io.emit('users', users);
    });

    socket.on('message', (data) => {
        io.emit('message', data);

        if (data.text.startsWith('/ai ') || data.text.toLowerCase().includes('восставший')) {
            const prompt = data.text.replace('/ai ', '');
            setTimeout(() => {
                io.emit('message', {
                    user: 'VSEZNAYKA',
                    text: `🤖 ${resurrectedLogic(prompt)}`,
                    timestamp: new Date().toISOString()
                });
            }, 1000);
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('users', users);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`ECLIPSE OS SERVER RUNNING ON PORT ${PORT}`);
});
