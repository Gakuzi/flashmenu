const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Прокси для Gemini API
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Используем API ключ из переменных окружения или конфигурации
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4';
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

        console.log('🤖 Gemini API запрос:', prompt.substring(0, 100) + '...');

        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Gemini API Error:', errorData);
            return res.status(response.status).json({ 
                error: errorData.error?.message || 'Gemini API Error',
                details: errorData
            });
        }

        const data = await response.json();
        console.log('✅ Gemini API ответ получен');
        
        res.json(data);
    } catch (error) {
        console.error('❌ Ошибка сервера:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: error.message 
        });
    }
});

// Тестовый endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        gemini: !!process.env.GEMINI_API_KEY
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Откройте http://localhost:${PORT}`);
    console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Настроен' : 'Используется дефолтный ключ'}`);
});

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
}); 