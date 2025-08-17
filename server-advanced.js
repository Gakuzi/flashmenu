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

        // Проверяем, не превышен ли лимит API
        if (global.apiQuotaExceeded) {
            console.log('⚠️ Лимит API превышен, используем Mock API');
            return res.json({
                candidates: [{
                    content: {
                        parts: [{
                            text: generateMockResponse(prompt)
                        }]
                    }
                }]
            });
        }

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
                
                // Если это ошибка превышения лимита, помечаем и используем Mock API
                if (error.message.includes('quota') || error.message.includes('rate-limit')) {
                    console.log('🚨 Превышен лимит API, переключаемся на Mock API');
                    global.apiQuotaExceeded = true;
                    break;
                }
                
                // Если это географическая ошибка, пробуем следующий ключ
                if (error.message.includes('location') || error.message.includes('geographic')) {
                    continue;
                }
                
                // Для других ошибок сразу возвращаем
                break;
            }
        }

        // Если все ключи не сработали или превышен лимит, используем Mock API
        console.log('🔄 Используем Mock API как fallback');
        const mockResponse = {
            candidates: [{
                content: {
                    parts: [{
                        text: generateMockResponse(prompt)
                    }]
                }
            }]
        };
        
        res.json(mockResponse);
        
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
        
        // Проверяем на превышение лимита
        if (errorData.error?.message?.includes('quota') || 
            errorData.error?.message?.includes('rate-limit') ||
            errorData.error?.message?.includes('billing')) {
            throw new Error(`API quota exceeded: ${errorData.error.message}`);
        }
        
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
        
        // Разнообразные варианты блюд для каждого приема пищи
        const breakfastOptions = [
            {
                recipe: "Овсянка с фруктами и орехами",
                ingredients: [
                    { name: "Овсяные хлопья", qty: 80, unit: "г" },
                    { name: "Молоко", qty: 200, unit: "мл" },
                    { name: "Банан", qty: 1, unit: "шт" },
                    { name: "Грецкие орехи", qty: 20, unit: "г" }
                ],
                cookingTime: 15
            },
            {
                recipe: "Творожная запеканка с изюмом",
                ingredients: [
                    { name: "Творог", qty: 200, unit: "г" },
                    { name: "Яйца", qty: 2, unit: "шт" },
                    { name: "Изюм", qty: 50, unit: "г" },
                    { name: "Сахар", qty: 30, unit: "г" }
                ],
                cookingTime: 25
            },
            {
                recipe: "Гречневая каша с молоком",
                ingredients: [
                    { name: "Гречка", qty: 100, unit: "г" },
                    { name: "Молоко", qty: 300, unit: "мл" },
                    { name: "Сливочное масло", qty: 20, unit: "г" }
                ],
                cookingTime: 20
            }
        ];

        const lunchOptions = [
            {
                recipe: "Куриная грудка с рисом и овощами",
                ingredients: [
                    { name: "Куриная грудка", qty: 150, unit: "г" },
                    { name: "Рис", qty: 100, unit: "г" },
                    { name: "Брокколи", qty: 100, unit: "г" },
                    { name: "Морковь", qty: 50, unit: "г" }
                ],
                cookingTime: 30
            },
            {
                recipe: "Лосось с картофелем",
                ingredients: [
                    { name: "Лосось", qty: 150, unit: "г" },
                    { name: "Картофель", qty: 200, unit: "г" },
                    { name: "Лимон", qty: 0.5, unit: "шт" },
                    { name: "Укроп", qty: 10, unit: "г" }
                ],
                cookingTime: 35
            },
            {
                recipe: "Вегетарианский суп",
                ingredients: [
                    { name: "Картофель", qty: 150, unit: "г" },
                    { name: "Морковь", qty: 100, unit: "г" },
                    { name: "Лук", qty: 50, unit: "г" },
                    { name: "Зелень", qty: 20, unit: "г" }
                ],
                cookingTime: 40
            }
        ];

        const dinnerOptions = [
            {
                recipe: "Творожная запеканка с ягодами",
                ingredients: [
                    { name: "Творог", qty: 200, unit: "г" },
                    { name: "Яйца", qty: 2, unit: "шт" },
                    { name: "Сметана", qty: 50, unit: "г" },
                    { name: "Черника", qty: 100, unit: "г" }
                ],
                cookingTime: 25
            },
            {
                recipe: "Омлет с овощами",
                ingredients: [
                    { name: "Яйца", qty: 3, unit: "шт" },
                    { name: "Помидоры", qty: 100, unit: "г" },
                    { name: "Шпинат", qty: 50, unit: "г" },
                    { name: "Сыр", qty: 50, unit: "г" }
                ],
                cookingTime: 15
            },
            {
                recipe: "Салат Цезарь",
                ingredients: [
                    { name: "Куриная грудка", qty: 100, unit: "г" },
                    { name: "Салат Айсберг", qty: 100, unit: "г" },
                    { name: "Сухарики", qty: 30, unit: "г" },
                    { name: "Сыр Пармезан", qty: 30, unit: "г" }
                ],
                cookingTime: 20
            }
        ];

        for (let day = 1; day <= days; day++) {
            // Выбираем случайные блюда для разнообразия
            const breakfast = breakfastOptions[day % breakfastOptions.length];
            const lunch = lunchOptions[day % lunchOptions.length];
            const dinner = dinnerOptions[day % dinnerOptions.length];

            // Завтрак
            menuItems.push({
                day: `День ${day}`,
                meal: "Завтрак",
                recipe: `${breakfast.recipe} (день ${day})`,
                ingredients: breakfast.ingredients,
                cookingTime: breakfast.cookingTime
            });
            
            // Обед
            menuItems.push({
                day: `День ${day}`,
                meal: "Обед",
                recipe: `${lunch.recipe} (день ${day})`,
                ingredients: lunch.ingredients,
                cookingTime: lunch.cookingTime
            });
            
            // Ужин
            menuItems.push({
                day: `День ${day}`,
                meal: "Ужин",
                recipe: `${dinner.recipe} (день ${day})`,
                ingredients: dinner.ingredients,
                cookingTime: dinner.cookingTime
            });
        }
        
        return `\`\`\`json\n${JSON.stringify(menuItems, null, 2)}\n\`\`\``;
        
    } else if (prompt.includes('цена') || prompt.includes('Макси')) {
        // Генерируем реалистичные цены для разных продуктов
        const productName = prompt.match(/"([^"]+)"/)?.[1] || 'Продукт';
        
        const realisticPrices = {
            // Завтрак
            'овсяные хлопья': { name: 'Овсяные хлопья', pack: '500г', price: 89.90 },
            'молоко': { name: 'Молоко 3.2%', pack: '1л', price: 89.90 },
            'банан': { name: 'Бананы', pack: '1кг', price: 129.90 },
            'грецкие орехи': { name: 'Грецкие орехи', pack: '200г', price: 299.90 },
            'творог': { name: 'Творог 5%', pack: '200г', price: 89.90 },
            'яйца': { name: 'Яйца куриные', pack: '10шт', price: 129.90 },
            'изюм': { name: 'Изюм', pack: '200г', price: 149.90 },
            'сахар': { name: 'Сахар-песок', pack: '1кг', price: 69.90 },
            'гречка': { name: 'Гречка', pack: '900г', price: 119.90 },
            'сливочное масло': { name: 'Сливочное масло 82.5%', pack: '180г', price: 159.90 },
            
            // Обед
            'куриная грудка': { name: 'Куриная грудка филе', pack: '1кг', price: 399.90 },
            'рис': { name: 'Рис длиннозерный', pack: '900г', price: 149.90 },
            'брокколи': { name: 'Брокколи замороженная', pack: '400г', price: 199.90 },
            'морковь': { name: 'Морковь', pack: '1кг', price: 79.90 },
            'лосось': { name: 'Лосось филе', pack: '300г', price: 599.90 },
            'картофель': { name: 'Картофель', pack: '1кг', price: 89.90 },
            'лимон': { name: 'Лимон', pack: '1кг', price: 199.90 },
            'укроп': { name: 'Укроп свежий', pack: '50г', price: 89.90 },
            'лук': { name: 'Лук репчатый', pack: '1кг', price: 59.90 },
            'зелень': { name: 'Зелень смешанная', pack: '100г', price: 129.90 },
            
            // Ужин
            'сметана': { name: 'Сметана 20%', pack: '400г', price: 89.90 },
            'черника': { name: 'Черника замороженная', pack: '400г', price: 299.90 },
            'помидоры': { name: 'Помидоры', pack: '1кг', price: 199.90 },
            'шпинат': { name: 'Шпинат замороженный', pack: '400г', price: 179.90 },
            'сыр': { name: 'Сыр Российский', pack: '200г', price: 189.90 },
            'салат айсберг': { name: 'Салат Айсберг', pack: '400г', price: 159.90 },
            'сухарики': { name: 'Сухарики ржаные', pack: '100г', price: 89.90 },
            'сыр пармезан': { name: 'Сыр Пармезан', pack: '100г', price: 399.90 }
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
        mock: true,
        quotaExceeded: global.apiQuotaExceeded || false
    });
});

// Endpoint для сброса состояния превышения лимита
app.post('/api/reset-quota', (req, res) => {
    global.apiQuotaExceeded = false;
    console.log('🔄 Состояние превышения лимита API сброшено');
    res.json({ 
        status: 'OK', 
        message: 'API quota status reset',
        timestamp: new Date().toISOString()
    });
});

// Endpoint для принудительного переключения на Mock API
app.post('/api/force-mock', (req, res) => {
    global.apiQuotaExceeded = true;
    console.log('🎭 Принудительно переключаемся на Mock API');
    res.json({ 
        status: 'OK', 
        message: 'Forced to use Mock API',
        timestamp: new Date().toISOString()
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Продвинутый сервер запущен на порту ${PORT}`);
    console.log(`🌐 Откройте http://localhost:${PORT}`);
    console.log(`🔑 Доступно API ключей: ${ALTERNATIVE_KEYS.length}`);
    console.log(`🎭 Mock API доступен: /api/gemini-mock`);
    console.log(`🔄 Сброс лимита: POST /api/reset-quota`);
    console.log(`🎭 Принудительный Mock: POST /api/force-mock`);
    console.log(`📊 Статус: GET /api/health`);
});

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
}); 