// Пример серверной части для безопасной работы с Gemini API
// Этот файл демонстрирует, как создать безопасный прокси для API

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();

// Настройка CORS для безопасности
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://yourdomain.com'],
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Middleware для проверки API ключа (опционально)
const validateApiKey = (req, res, next) => {
    const clientApiKey = req.headers['x-api-key'];
    if (!clientApiKey || clientApiKey !== process.env.CLIENT_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Основной endpoint для Gemini API
app.post('/api/gemini', validateApiKey, async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Проверка длины промпта для предотвращения злоупотреблений
        if (prompt.length > 10000) {
            return res.status(400).json({ error: 'Prompt too long' });
        }

        const response = await fetch(process.env.GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
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
            console.error('Gemini API Error:', errorData);
            return res.status(response.status).json({ 
                error: 'Gemini API Error', 
                details: errorData.error?.message || 'Unknown error' 
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rate limiting (базовый)
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 Gemini API endpoint: /api/gemini`);
    console.log(`🏥 Health check: /health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
}); 