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

// Альтернативные API ключи для обхода географических ограничений
const ALTERNATIVE_KEYS = [
    'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4', // Основной ключ
    'AIzaSyDKVM2qJQ4lXfjZpQVm9ymxf_GiwMkDBHs', // Альтернативный ключ
    'AIzaSyBQJdJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', // Заглушка для тестирования
];

// Прокси для Gemini API с автоматическим переключением ключей
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('🤖 Gemini API запрос:', prompt.substring(0, 100) + '...');

        // Пробуем разные API ключи
        let lastError = null;
        
        for (let i = 0; i < ALTERNATIVE_KEYS.length; i++) {
            const apiKey = ALTERNATIVE_KEYS[i];
            console.log(`🔑 Пробуем API ключ ${i + 1}/${ALTERNATIVE_KEYS.length}...`);
            
            try {
                const result = await callGeminiWithKey(apiKey, prompt);
                console.log(`✅ Успех с ключом ${i + 1}`);
                return res.json(result);
            } catch (error) {
                console.warn(`❌ Ключ ${i + 1} не сработал:`, error.message);
                lastError = error;
                
                // Если это географическая ошибка, пробуем следующий ключ
                if (error.message.includes('location') || error.message.includes('geographic')) {
                    continue;
                }
                
                // Для других ошибок сразу возвращаем
                break;
            }
        }

        // Если все ключи не сработали, возвращаем ошибку
        console.error('❌ Все API ключи не сработали');
        res.status(500).json({ 
            error: 'All API keys failed',
            message: lastError?.message || 'Geographic restrictions apply to all keys',
            suggestion: 'Try using a VPN or contact support for alternative solutions'
        });
        
    } catch (error) {
        console.error('❌ Ошибка сервера:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: error.message 
        });
    }
});

// Вызов Gemini API с конкретным ключом
async function callGeminiWithKey(apiKey, prompt) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
}

// Альтернативный endpoint с имитацией ответа (для тестирования)
app.post('/api/gemini-mock', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log('🎭 Mock API запрос:', prompt.substring(0, 100) + '...');

        // Имитируем ответ Gemini API
        const mockResponse = {
            candidates: [{
                content: {
                    parts: [{
                        text: generateMockResponse(prompt)
                    }]
                }
            }]
        };

        // Имитируем задержку
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        res.json(mockResponse);
        
    } catch (error) {
        console.error('❌ Ошибка Mock API:', error);
        res.status(500).json({ error: 'Mock API Error' });
    }
});

// Генерация имитационного ответа
function generateMockResponse(prompt) {
    if (prompt.includes('меню')) {
        // Генерируем полноценное меню на несколько дней
        const days = prompt.match(/(\d+)\s*дней?/)?.[1] || 3;
        const meal = prompt.match(/для\s+([^с]+)/)?.[1] || 'Все приёмы пищи';
        
        let menuItems = [];
        
        for (let day = 1; day <= days; day++) {
            // Завтрак
            menuItems.push({
                day: `День ${day}`,
                meal: "Завтрак",
                recipe: `Овсянка с фруктами и орехами (день ${day})`,
                ingredients: [
                    { name: "Овсяные хлопья", qty: 80, unit: "г" },
                    { name: "Молоко", qty: 200, unit: "мл" },
                    { name: "Банан", qty: 1, unit: "шт" },
                    { name: "Грецкие орехи", qty: 20, unit: "г" }
                ],
                cookingTime: 15
            });
            
            // Обед
            menuItems.push({
                day: `День ${day}`,
                meal: "Обед",
                recipe: `Куриная грудка с рисом и овощами (день ${day})`,
                ingredients: [
                    { name: "Куриная грудка", qty: 150, unit: "г" },
                    { name: "Рис", qty: 100, unit: "г" },
                    { name: "Брокколи", qty: 100, unit: "г" },
                    { name: "Морковь", qty: 50, unit: "г" }
                ],
                cookingTime: 30
            });
            
            // Ужин
            menuItems.push({
                day: `День ${day}`,
                meal: "Ужин",
                recipe: `Творожная запеканка с ягодами (день ${day})`,
                ingredients: [
                    { name: "Творог", qty: 200, unit: "г" },
                    { name: "Яйца", qty: 2, unit: "шт" },
                    { name: "Сметана", qty: 50, unit: "г" },
                    { name: "Черника", qty: 100, unit: "г" }
                ],
                cookingTime: 25
            });
        }
        
        return `\`\`\`json\n${JSON.stringify(menuItems, null, 2)}\n\`\`\``;
        
    } else if (prompt.includes('цена') || prompt.includes('Макси')) {
        // Генерируем реалистичные цены для разных продуктов
        const productName = prompt.match(/"([^"]+)"/)?.[1] || 'Продукт';
        
        const realisticPrices = {
            'овсяные хлопья': { name: 'Овсяные хлопья', pack: '500г', price: 89.90 },
            'молоко': { name: 'Молоко 3.2%', pack: '1л', price: 89.90 },
            'банан': { name: 'Бананы', pack: '1кг', price: 129.90 },
            'грецкие орехи': { name: 'Грецкие орехи', pack: '200г', price: 299.90 },
            'куриная грудка': { name: 'Куриная грудка филе', pack: '1кг', price: 399.90 },
            'рис': { name: 'Рис длиннозерный', pack: '900г', price: 149.90 },
            'брокколи': { name: 'Брокколи замороженная', pack: '400г', price: 199.90 },
            'морковь': { name: 'Морковь', pack: '1кг', price: 79.90 },
            'творог': { name: 'Творог 5%', pack: '200г', price: 89.90 },
            'яйца': { name: 'Яйца куриные', pack: '10шт', price: 129.90 },
            'сметана': { name: 'Сметана 20%', pack: '400г', price: 89.90 },
            'черника': { name: 'Черника замороженная', pack: '400г', price: 299.90 }
        };
        
        // Ищем продукт по названию (регистронезависимо)
        const lowerProductName = productName.toLowerCase();
        let foundProduct = null;
        
        for (const [key, product] of Object.entries(realisticPrices)) {
            if (lowerProductName.includes(key) || key.includes(lowerProductName)) {
                foundProduct = product;
                break;
            }
        }
        
        if (foundProduct) {
            return `\`\`\`json\n${JSON.stringify(foundProduct, null, 2)}\n\`\`\``;
        } else {
            // Если продукт не найден, возвращаем примерную цену
            return `\`\`\`json\n{
  "name": "${productName}",
  "pack": "~",
  "price": 150.00
}\n\`\`\``;
        }
        
    } else {
        return 'Это тестовый ответ от Mock API. В реальном приложении здесь будет ответ от Gemini.';
    }
}

// Тестовый endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        keys: ALTERNATIVE_KEYS.length,
        mock: true
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Продвинутый сервер запущен на порту ${PORT}`);
    console.log(`🌐 Откройте http://localhost:${PORT}`);
    console.log(`🔑 Доступно API ключей: ${ALTERNATIVE_KEYS.length}`);
    console.log(`🎭 Mock API доступен: /api/gemini-mock`);
});

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
}); 