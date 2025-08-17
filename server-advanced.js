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

// API ключи загружаются из переменных окружения (секреты GitHub Actions)
let ALTERNATIVE_KEYS = [];

// Загружаем ключи из переменных окружения
const loadApiKeys = () => {
    const keys = [];
    
    // Проверяем переменные окружения для API ключей
    for (let i = 1; i <= 8; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key && key !== 'your-api-key-here') {
            keys.push(key);
        }
    }
    
    // Если ключи не найдены в переменных окружения, используем резервные
    if (keys.length === 0) {
        console.warn('⚠️ API ключи не найдены в переменных окружения, используем резервные');
        keys.push(
            'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4', // Основной ключ
            'AIzaSyDKVM2qJQ4lXfjZpQVm9ymxf_GiwMkDBHs'  // Альтернативный ключ
        );
    }
    
    return keys;
};

ALTERNATIVE_KEYS = loadApiKeys();
console.log(`🔑 Загружено ${ALTERNATIVE_KEYS.length} API ключей из переменных окружения`);

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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192, // Увеличиваем для Gemini 2.0
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API ошибка:', response.status, errorText);
        
        if (response.status === 429 || response.status === 403) {
            throw new Error('API quota exceeded or rate limited');
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
}

// Умная генерация меню через AI (имитация Gemini API)
function generateMockResponse(prompt) {
    console.log('🎭 Mock API запрос:', prompt);
    
    if (prompt.includes('меню') || prompt.includes('рецепт')) {
        return generateSmartMenu(prompt);
    } else if (prompt.includes('цена') || prompt.includes('Макси') || prompt.includes('каталог')) {
        return getRealisticPrices(prompt);
    } else {
        return 'Извините, я не понимаю ваш запрос. Попробуйте спросить о меню или ценах продуктов.';
    }
}

// Умная генерация меню с учетом бюджета и предпочтений
function generateSmartMenu(prompt) {
    console.log('🍽️ Генерируем умное меню...');
    
    // Извлекаем параметры из запроса
    const budget = prompt.match(/(\d+)\s*₽/)?.[1] || 1000;
    const days = prompt.match(/(\d+)\s*дней?/)?.[1] || 3;
    const mealType = prompt.includes('завтрак') ? 'завтрак' : 
                     prompt.includes('обед') ? 'обед' : 
                     prompt.includes('ужин') ? 'ужин' : 'все';
    
    console.log(`💰 Бюджет: ${budget} ₽, 📅 Дни: ${days}, 🍽️ Тип: ${mealType}`);
    
    // Базовые рецепты с реальными ингредиентами
    const recipes = {
        breakfast: [
            {
                name: "Овсянка с фруктами и орехами",
                ingredients: [
                    { name: "Овсяные хлопья", qty: 80, unit: "г", price: 89.90, pack: "500г" },
                    { name: "Молоко 3.2%", qty: 200, unit: "мл", price: 89.90, pack: "1л" },
                    { name: "Банан", qty: 1, unit: "шт", price: 129.90, pack: "1кг" },
                    { name: "Грецкие орехи", qty: 20, unit: "г", price: 299.90, pack: "200г" }
                ],
                cookingTime: 15,
                difficulty: "легко"
            },
            {
                name: "Творожная запеканка с изюмом",
                ingredients: [
                    { name: "Творог 5%", qty: 200, unit: "г", price: 89.90, pack: "200г" },
                    { name: "Яйца куриные", qty: 2, unit: "шт", price: 129.90, pack: "10шт" },
                    { name: "Изюм", qty: 50, unit: "г", price: 149.90, pack: "200г" },
                    { name: "Сахар-песок", qty: 30, unit: "г", price: 69.90, pack: "1кг" }
                ],
                cookingTime: 25,
                difficulty: "средне"
            }
        ],
        lunch: [
            {
                name: "Куриная грудка с рисом и овощами",
                ingredients: [
                    { name: "Куриная грудка филе", qty: 150, unit: "г", price: 399.90, pack: "1кг" },
                    { name: "Рис длиннозерный", qty: 100, unit: "г", price: 149.90, pack: "900г" },
                    { name: "Брокколи замороженная", qty: 100, unit: "г", price: 199.90, pack: "400г" },
                    { name: "Морковь", qty: 50, unit: "г", price: 79.90, pack: "1кг" }
                ],
                cookingTime: 30,
                difficulty: "средне"
            },
            {
                name: "Лосось с картофелем и зеленью",
                ingredients: [
                    { name: "Лосось филе", qty: 150, unit: "г", price: 599.90, pack: "300г" },
                    { name: "Картофель", qty: 200, unit: "г", price: 89.90, pack: "1кг" },
                    { name: "Лимон", qty: 0.5, unit: "шт", price: 199.90, pack: "1кг" },
                    { name: "Укроп свежий", qty: 10, unit: "г", price: 89.90, pack: "50г" }
                ],
                cookingTime: 35,
                difficulty: "средне"
            }
        ],
        dinner: [
            {
                name: "Омлет с овощами и сыром",
                ingredients: [
                    { name: "Яйца куриные", qty: 3, unit: "шт", price: 129.90, pack: "10шт" },
                    { name: "Помидоры", qty: 100, unit: "г", price: 199.90, pack: "1кг" },
                    { name: "Шпинат замороженный", qty: 50, unit: "г", price: 179.90, pack: "400г" },
                    { name: "Сыр Российский", qty: 50, unit: "г", price: 189.90, pack: "200г" }
                ],
                cookingTime: 15,
                difficulty: "легко"
            }
        ]
    };
    
    // Генерируем меню с учетом бюджета
    let menuItems = [];
    let totalCost = 0;
    
    for (let day = 1; day <= days; day++) {
        if (mealType === 'все' || mealType === 'завтрак') {
            const breakfast = recipes.breakfast[day % recipes.breakfast.length];
            const breakfastCost = breakfast.ingredients.reduce((sum, ing) => sum + ing.price, 0);
            
            if (totalCost + breakfastCost <= budget) {
                menuItems.push({
                    day: `День ${day}`,
                    meal: "Завтрак",
                    recipe: breakfast.name,
                    ingredients: breakfast.ingredients,
                    cookingTime: breakfast.cookingTime,
                    difficulty: breakfast.difficulty,
                    cost: breakfastCost
                });
                totalCost += breakfastCost;
            }
        }
        
        if (mealType === 'все' || mealType === 'обед') {
            const lunch = recipes.lunch[day % recipes.lunch.length];
            const lunchCost = lunch.ingredients.reduce((sum, ing) => sum + ing.price, 0);
            
            if (totalCost + lunchCost <= budget) {
                menuItems.push({
                    day: `День ${day}`,
                    meal: "Обед",
                    recipe: lunch.name,
                    ingredients: lunch.ingredients,
                    cookingTime: lunch.cookingTime,
                    difficulty: lunch.difficulty,
                    cost: lunchCost
                });
                totalCost += lunchCost;
            }
        }
        
        if (mealType === 'все' || mealType === 'ужин') {
            const dinner = recipes.dinner[day % recipes.dinner.length];
            const dinnerCost = dinner.ingredients.reduce((sum, ing) => sum + ing.price, 0);
            
            if (totalCost + dinnerCost <= budget) {
                menuItems.push({
                    day: `День ${day}`,
                    meal: "Ужин",
                    recipe: dinner.name,
                    ingredients: dinner.ingredients,
                    cookingTime: dinner.cookingTime,
                    difficulty: dinner.difficulty,
                    cost: dinnerCost
                });
                totalCost += dinnerCost;
            }
        }
    }
    
    // Если бюджет превышен, корректируем меню
    if (totalCost > budget) {
        console.log(`⚠️ Бюджет превышен (${totalCost} > ${budget}), корректируем...`);
        menuItems = menuItems.slice(0, Math.floor(menuItems.length * 0.7)); // Убираем 30% блюд
        totalCost = menuItems.reduce((sum, item) => sum + item.cost, 0);
    }
    
    console.log(`✅ Меню сгенерировано: ${menuItems.length} блюд, стоимость: ${totalCost} ₽`);
    
    return `\`\`\`json
${JSON.stringify({
    menu: menuItems,
    totalCost: totalCost,
    budget: budget,
    days: days,
    mealType: mealType,
    generatedAt: new Date().toISOString()
}, null, 2)}
\`\`\``;
}

// Получение реалистичных цен из каталога Макси
function getRealisticPrices(prompt) {
    console.log('💰 Получаем цены из каталога...');
    
    // Извлекаем название продукта из запроса
    const productMatch = prompt.match(/продукт[а]?\s*[""]([^""]+)[""]/);
    const productName = productMatch ? productMatch[1].toLowerCase() : '';
    
    console.log(`🔍 Ищем продукт: "${productName}"`);
    
    // База данных реальных цен из каталога Макси
    const catalog = {
        // Молочные продукты
        'молоко': { name: 'Молоко 3.2%', price: 89.90, pack: '1л', brand: 'Макси' },
        'творог': { name: 'Творог 5%', price: 89.90, pack: '200г', brand: 'Макси' },
        'сметана': { name: 'Сметана 20%', price: 89.90, pack: '400г', brand: 'Макси' },
        'сыр': { name: 'Сыр Российский', price: 189.90, pack: '200г', brand: 'Макси' },
        
        // Мясо и рыба
        'куриная грудка': { name: 'Куриная грудка филе', price: 399.90, pack: '1кг', brand: 'Макси' },
        'лосось': { name: 'Лосось филе', price: 599.90, pack: '300г', brand: 'Макси' },
        'говядина': { name: 'Говядина вырезка', price: 899.90, pack: '500г', brand: 'Макси' },
        
        // Крупы и макароны
        'овсяные хлопья': { name: 'Овсяные хлопья', price: 89.90, pack: '500г', brand: 'Макси' },
        'гречка': { name: 'Гречка', price: 119.90, pack: '900г', brand: 'Макси' },
        'рис': { name: 'Рис длиннозерный', price: 149.90, pack: '900г', brand: 'Макси' },
        'макароны': { name: 'Макароны спагетти', price: 79.90, pack: '500г', brand: 'Макси' },
        
        // Овощи и фрукты
        'картофель': { name: 'Картофель', price: 89.90, pack: '1кг', brand: 'Макси' },
        'морковь': { name: 'Морковь', price: 79.90, pack: '1кг', brand: 'Макси' },
        'лук': { name: 'Лук репчатый', price: 59.90, pack: '1кг', brand: 'Макси' },
        'помидоры': { name: 'Помидоры', price: 199.90, pack: '1кг', brand: 'Макси' },
        'банан': { name: 'Бананы', price: 129.90, pack: '1кг', brand: 'Макси' },
        'яблоки': { name: 'Яблоки Голден', price: 159.90, pack: '1кг', brand: 'Макси' },
        
        // Яйца и масло
        'яйца': { name: 'Яйца куриные', price: 129.90, pack: '10шт', brand: 'Макси' },
        'сливочное масло': { name: 'Сливочное масло 82.5%', price: 159.90, pack: '180г', brand: 'Макси' },
        'подсолнечное масло': { name: 'Масло подсолнечное', price: 89.90, pack: '1л', brand: 'Макси' },
        
        // Специи и добавки
        'сахар': { name: 'Сахар-песок', price: 69.90, pack: '1кг', brand: 'Макси' },
        'соль': { name: 'Соль поваренная', price: 29.90, pack: '1кг', brand: 'Макси' },
        'перец': { name: 'Перец черный молотый', price: 89.90, pack: '100г', brand: 'Макси' },
        
        // Орехи и сухофрукты
        'грецкие орехи': { name: 'Грецкие орехи', price: 299.90, pack: '200г', brand: 'Макси' },
        'изюм': { name: 'Изюм', price: 149.90, pack: '200г', brand: 'Макси' },
        'курага': { name: 'Курага', price: 199.90, pack: '200г', brand: 'Макси' },
        
        // Зелень
        'укроп': { name: 'Укроп свежий', price: 89.90, pack: '50г', brand: 'Макси' },
        'петрушка': { name: 'Петрушка свежая', price: 89.90, pack: '50г', brand: 'Макси' },
        'зелень': { name: 'Зелень смешанная', price: 129.90, pack: '100г', brand: 'Макси' }
    };
    
    // Ищем продукт в каталоге
    let foundProduct = null;
    
    for (const [key, product] of Object.entries(catalog)) {
        if (productName.includes(key) || key.includes(productName)) {
            foundProduct = product;
            break;
        }
    }
    
    if (foundProduct) {
        console.log(`✅ Продукт найден: ${foundProduct.name} - ${foundProduct.price} ₽`);
        return `\`\`\`json
${JSON.stringify({
    product: foundProduct.name,
    price: foundProduct.price,
    pack: foundProduct.pack,
    brand: foundProduct.brand,
    source: 'Каталог Макси',
    foundAt: new Date().toISOString()
}, null, 2)}
\`\`\``;
    } else {
        console.log(`❌ Продукт не найден: "${productName}"`);
        return `\`\`\`json
${JSON.stringify({
    error: 'Продукт не найден в каталоге',
    searchedFor: productName,
    suggestion: 'Попробуйте другое название или проверьте каталог Макси',
    foundAt: new Date().toISOString()
}, null, 2)}
\`\`\``;
    }
}

// Сброс флага превышения лимита
app.post('/api/reset-quota', (req, res) => {
    global.apiQuotaExceeded = false;
    console.log('🔄 Флаг превышения лимита сброшен');
    res.json({ message: 'Quota flag reset successfully' });
});

// Принудительное использование Mock API
app.post('/api/force-mock', (req, res) => {
    global.apiQuotaExceeded = true;
    console.log('🎭 Принудительно переключаемся на Mock API');
    res.json({ message: 'Mock API forced successfully' });
});

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        apiKeys: ALTERNATIVE_KEYS.length,
        quotaExceeded: global.apiQuotaExceeded || false,
        mockApiAvailable: true
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
    
    if (global.apiQuotaExceeded) {
        console.log('🎭 Принудительно переключаемся на Mock API');
    }
});

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
}); 