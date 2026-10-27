const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.static(path.join(__dirname)));

let users = {};
let chatHistory = []; // Память для самообучения (контекст)

// Функция запроса к ИИ (DeepSeek через OpenRouter)
async function askAI(prompt) {
    if (!process.env.OPENROUTER_API_KEY) {
        return "⚠️ Ошибка: API-ключ не найден. Добавь OPENROUTER_API_KEY в настройках Render.";
    }

    try {
        chatHistory.push({ role: "user", content: prompt });
        if (chatHistory.length > 10) chatHistory.shift(); // Храним последние 10 сообщений

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'qwen/qwen3.6-plus:free', 
            messages: [
                { role: "system", content: "Ты — VSEZNAYKA, умный ИИ-помощник внутри системы ECLIPSE OS. Отвечай кратко, по делу, с легкой иронией и уважением к создателю (snegoc)." },
                ...chatHistory
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://eclipse-core.onrender.com',
                'X-Title': 'ECLIPSE OS'
            }
        });

        const aiReply = response.data.choices[0].message.content;
        chatHistory.push({ role: "assistant", content: aiReply });
        
        return aiReply;
    } catch (error) {
        console.error('AI Error:', error.response ? error.response.data : error.message);
        return "⚠️ Ошибка связи с нейросетью. Проверь логи на Render.";
    }
}

io.on('connection', (socket) => {
    socket.on('join', (userData) => {
        users[socket.id] = { ...userData, status: 'online', activity: 'в системе' };
        io.emit('users', users);
    });

    socket.on('message', async (data) => {
        io.emit('message', data);

        if (data.text.startsWith('/ai ')) {
            const prompt = data.text.replace('/ai ', '');
            const aiReply = await askAI(prompt);
            
            io.emit('message', {
                user: 'VSEZNAYKA',
                text: `🤖 ${aiReply}`,
                timestamp: new Date().toISOString()
            });
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
