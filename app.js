// Состояние приложения
let currentUser = null;
let currentMenu = null;
let currentProducts = [];
let boughtProducts = [];
let availableIngredients = [];
let menus = [];
let activeTimer = null;

// Профиль пользователя
let userProfile = {
    name: '',
    email: '',
    age: 30,
    weight: 70,
    height: 170,
    activity: 'moderate', // low, moderate, high
    preferences: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        lactoseFree: false,
        spicy: false,
        allergies: []
    },
    goals: {
        weightLoss: false,
        weightGain: false,
        maintenance: false,
        muscleGain: false
    }
};

// Инициализация Supabase
let supabaseClient = null;

// Конфигурация API
const API_CONFIG = {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
};

// Массив API ключей для ротации
let apiKeys = [];
let currentKeyIndex = 0;

// Инициализация API ключей
function initializeApiKeys() {
    // Загружаем ключи только из GitHub Actions секретов
    // В продакшене эти переменные заполняются автоматически GitHub Actions
    for (let i = 1; i <= 8; i++) {
        const key = window[`GEMINI_API_KEY_${i}`];
        if (key && key !== '[ВАШ_API_КЛЮЧ]' && key !== `[ВАШ_API_КЛЮЧ_${i}]`) {
            apiKeys.push(key);
        }
    }
    
    // Если нет ключей из секретов, используем Mock
    if (apiKeys.length === 0) {
        console.log('🎭 Нет API ключей из секретов, используем Mock данные');
        return;
    }
    
    console.log(`🔑 Загружено ${apiKeys.length} API ключей из секретов`);
    apiKeys.forEach((key, index) => {
        const maskedKey = key.substring(0, 10) + '...' + key.substring(key.length - 4);
        console.log(`  ${index + 1}. ${maskedKey}`);
    });
}

// Получение текущего API ключа
function getCurrentApiKey() {
    if (apiKeys.length === 0) {
        initializeApiKeys();
    }
    return apiKeys[currentKeyIndex];
}

// Переключение на следующий ключ
function switchToNextKey() {
    if (apiKeys.length === 0) return null;
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.log(`🔄 Переключаемся на ключ ${currentKeyIndex + 1}/${apiKeys.length}`);
    return getCurrentApiKey();
}

// Сброс индекса ключа
function resetKeyIndex() {
    currentKeyIndex = 0;
    console.log('🔄 Сброс индекса ключа на первый');
}

// Простой вызов Gemini API с ротацией ключей
async function callGeminiAPI(prompt) {
    // Инициализируем ключи при первом вызове
    if (apiKeys.length === 0) {
        initializeApiKeys();
    }
    
    // Если нет ключей из секретов, используем Mock данные
    if (apiKeys.length === 0) {
        console.log('🎭 Используем Mock данные (нет API ключей из секретов)');
        return generateMockResponse(prompt);
    }

    // Пробуем все ключи по очереди
    const maxAttempts = apiKeys.length;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
        const apiKey = getCurrentApiKey();
        
        if (!apiKey) {
            console.log('❌ Нет доступных API ключей');
            break;
        }
        
        try {
            console.log(`🔑 Попытка ${attempt + 1}/${maxAttempts} с ключом ${currentKeyIndex + 1}/${apiKeys.length}`);
            
            const url = `${API_CONFIG.baseUrl}?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const result = data.candidates[0].content.parts[0].text;
                console.log('✅ Успешный ответ от API');
                return result;
            } else {
                throw new Error('Неверный формат ответа API');
            }
            
    } catch (error) {
            console.warn(`❌ Ошибка с ключом ${currentKeyIndex + 1}:`, error.message);
            switchToNextKey();
            attempt++;
            
            if (attempt >= maxAttempts) {
                console.error('❌ Все ключи исчерпаны, используем Mock данные');
                return generateMockResponse(prompt);
            }
        }
    }
    
    return generateMockResponse(prompt);
}

// Генерация Mock ответа для демонстрации
function generateMockResponse(prompt) {
    console.log('🎭 Генерируем Mock ответ для:', prompt.substring(0, 100) + '...');
    
    if (prompt.includes('меню')) {
        return JSON.stringify([
            {
                day: 1,
            meal: "Завтрак",
                recipe: "Овсяная каша с яблоками",
            ingredients: [
>>>>>>> main
                    { name: "овсянка", qty: 100, unit: "г" },
                    { name: "молоко", qty: 200, unit: "мл" },
                    { name: "яблоко", qty: 1, unit: "шт" },
                    { name: "мед", qty: 10, unit: "г" }
            ],
            cookingTime: 15
        },
        {
                day: 1,
            meal: "Обед",
            recipe: "Куриный суп с овощами",
            ingredients: [
>>>>>>> main
                    { name: "куриная грудка", qty: 200, unit: "г" },
                    { name: "картофель", qty: 300, unit: "г" },
                    { name: "морковь", qty: 100, unit: "г" },
                    { name: "лук", qty: 50, unit: "г" }
    ],
            cookingTime: 45
>>>>>>> main
            }
        ]);
    } else if (prompt.includes('каталог') || prompt.includes('цена') || prompt.includes('продукт')) {
        // Генерируем реалистичные данные продуктов из каталога
        const productName = prompt.match(/"([^"]+)"/)?.[1] || "продукт";
        const randomPrice = Math.floor(Math.random() * 500) + 50;
        const units = ["кг", "л", "шт", "г", "мл"];
        const unit = units[Math.floor(Math.random() * units.length)];
        const packs = ["1 кг", "1 л", "500 г", "250 мл", "10 шт"];
        const pack = packs[Math.floor(Math.random() * packs.length)];
        
        return JSON.stringify({
            name: productName,
            pack: pack,
            price: randomPrice,
            unit: unit,
            qty: 1,
            sum: randomPrice
        });
    }
    
    return "Mock ответ";
}

// Основная функция генерации меню с правильной логикой
async function generateMenu(e) {
    e.preventDefault();
    
    const budget = parseInt(document.getElementById('budget').value);
    const days = parseInt(document.getElementById('days').value);
    const start = document.getElementById('start').value;
    const meal = document.getElementById('meal').value;

    if (budget < 500) {
        showMessage('Бюджет должен быть не менее 500 ₽', 'error');
        return;
    }

    showLoading(true);
    showMessage('Генерация меню с учетом реальных цен...', 'success');

    try {
        console.log('🚀 Начинаем генерацию меню с учетом каталога Макси...');
        console.log('💰 Бюджет:', budget, '₽');
        console.log('📅 Дни:', days);
        console.log('🍽️ Прием пищи:', meal);
        console.log('📍 Начало:', start);
        
        // Шаг 1: Генерация меню с учетом реальных цен из каталога Макси
        const menuWithPrices = await generateMenuWithRealPrices(budget, days, meal, start);
        if (!menuWithPrices) {
            throw new Error('Не удалось сгенерировать меню с учетом реальных цен');
        }
        
        // Шаг 2: Предложение пользователю скорректировать меню
        const adjustedMenu = await showMenuCorrectionDialog(menuWithPrices.menu, budget, days, meal, start);
        if (!adjustedMenu) {
            showMessage('Генерация меню отменена', 'info');
            return;
        }
        
        // Шаг 3: Обновляем цены для скорректированного меню
        const updatedProducts = await updatePricesForMenu(adjustedMenu);
        if (!updatedProducts) {
            throw new Error('Не удалось обновить цены для скорректированного меню');
        }
        
        // Шаг 4: Показываем список продуктов с кнопками выбора
        const userProductChoices = await showProductsChoiceDialog(updatedProducts, budget);
        if (!userProductChoices) {
            showMessage('Выбор продуктов отменен', 'info');
            return;
        }
        
        // Шаг 5: Обрабатываем выбор пользователя
        await processUserProductChoices(userProductChoices, budget, days, meal, start, adjustedMenu);

    } catch (error) {
        console.error('Ошибка генерации меню:', error);
        showMessage(`Ошибка: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Шаг 1: Генерация меню с учетом реальных цен из каталога Макси
async function generateMenuWithRealPrices(budget, days, meal, start) {
    console.log('🤖 Генерируем меню с учетом реальных цен из каталога Макси...');
    
    const prompt = `Ты - опытный диетолог и повар в городе Архангельск. Создай разнообразное и сбалансированное меню на ${days} дней для ${meal} с учетом бюджета ${budget} ₽.

ВАЖНО: Пользователь находится в городе Архангельск и будет покупать продукты в магазине "Макси". 
Ты должен создать меню, используя только те продукты, которые реально доступны в каталоге Макси.

ТРЕБОВАНИЯ:
- Бюджет: ${budget} ₽ на ${days} дней
- Тип приема пищи: ${meal}
- Начало: ${start}
- Город: Архангельск
- Магазин: Макси
- Используй только продукты из каталога Макси
- Учитывай реальные цены из каталога
- Создавай разнообразные блюда
- Учитывай пищевую ценность и баланс

ПРОЦЕСС:
1. Сначала найди доступные продукты в каталоге Макси
2. Создай меню на основе реально доступных продуктов
3. Рассчитай общую стоимость с учетом реальных цен
4. Убедись, что общая стоимость не превышает бюджет

ФОРМАТ ОТВЕТА (строго JSON):
{
  "menu": [
    {
      "day": 1,
      "meal": "Завтрак",
      "recipe": "Название блюда",
      "ingredients": [
        {
          "name": "название продукта",
          "qty": количество,
          "unit": "единица измерения (г, мл, шт, кг, л)"
        }
      ],
      "cookingTime": время готовки в минутах
    }
  ],
  "products": [
    {
      "name": "точное название продукта из каталога",
      "pack": "описание упаковки",
      "price": реальная цена из каталога,
      "unit": "единица измерения",
      "qty": количество,
      "sum": общая стоимость
    }
  ],
  "totalCost": общая стоимость всех продуктов
}

Верни ТОЛЬКО JSON без дополнительного текста.`;

    const response = await callGeminiAPI(prompt);
    const result = parseJSONResponse(response);
    
    if (!result || !result.menu || !result.products) {
        throw new Error('Неверный формат ответа от AI');
    }
    
    console.log('✅ Меню сгенерировано с учетом реальных цен:', result.menu.length, 'блюд');
    console.log('💰 Общая стоимость:', result.totalCost, '₽');
    
    return result;
}

// Шаг 3: Обновление цен для скорректированного меню
async function updatePricesForMenu(menu) {
    console.log('💰 Обновляем цены для скорректированного меню...');
    
    // Собираем все уникальные ингредиенты
    const allIngredients = [];
    menu.forEach(item => {
        if (item.ingredients && Array.isArray(item.ingredients)) {
            item.ingredients.forEach(ingredient => {
                const existingIndex = allIngredients.findIndex(ing => 
                    ing.name.toLowerCase() === ingredient.name.toLowerCase()
                );
                
                if (existingIndex >= 0) {
                    allIngredients[existingIndex].qty += ingredient.qty || 1;
                } else {
                    allIngredients.push({
                        name: ingredient.name,
                        qty: ingredient.qty || 1,
                        unit: ingredient.unit || 'шт'
                    });
                }
            });
        }
    });
    
    // Поиск каждого ингредиента в каталоге Макси через AI
    const products = [];
    
    for (const ingredient of allIngredients) {
        try {
            const product = await findProductInMaxiCatalog(ingredient);
            if (product) {
                products.push(product);
            }
        } catch (error) {
            console.warn(`⚠️ Не удалось найти ${ingredient.name} в каталоге Макси:`, error.message);
            // Добавляем базовый продукт с предупреждением
            const basicProduct = {
                name: ingredient.name,
                pack: '~',
                price: 150,
                qty: ingredient.qty,
                unit: ingredient.unit,
                sum: 150 * ingredient.qty,
                available: false,
                note: 'Не найден в каталоге Макси'
            };
            products.push(basicProduct);
        }
    }
    
    console.log('💰 Цены обновлены:', products.length, 'продуктов');
    return products;
}

// Поиск продукта в каталоге Макси через AI
async function findProductInMaxiCatalog(ingredient) {
    const prompt = `Найди продукт "${ingredient.name}" в каталоге магазина "Макси" в городе Архангельск. 

ТРЕБОВАНИЯ:
- Название продукта: ${ingredient.name}
- Нужное количество: ${ingredient.qty} ${ingredient.unit}
- Магазин: Макси (Архангельск)
- Ищи только в каталоге Макси
- Учитывай разные варианты названий
- Найди наиболее подходящий продукт
- Укажи реальную цену из каталога

ФОРМАТ ОТВЕТА (строго JSON):
{
  "name": "точное название продукта из каталога Макси",
  "pack": "описание упаковки",
  "price": реальная цена из каталога Макси,
  "unit": "единица измерения",
  "qty": ${ingredient.qty},
  "sum": общая стоимость,
  "available": true
}

Если продукт не найден в каталоге Макси, верни null.`;

    const response = await callGeminiAPI(prompt);
    const product = parseJSONResponse(response);
    
    if (product && product.name && product.price) {
        console.log(`✅ Найден в Макси: ${product.name} - ${product.price} ₽`);
        return product;
    }
    
    throw new Error(`Продукт ${ingredient.name} не найден в каталоге Макси`);
}

// Шаг 4: Диалог выбора продуктов с двумя кнопками
async function showProductsChoiceDialog(products, budget) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Выбор продуктов</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Для каждого продукта выберите действие:</p>
                    
                    <div class="products-choice">
                        ${products.map((product, index) => `
                            <div class="product-choice-item" data-index="${index}">
                                <div class="product-info">
                                    <div class="product-name">
                                        <strong>${product.name}</strong>
                                        ${product.note ? `<span class="note">${product.note}</span>` : ''}
                                    </div>
                                    <div class="product-details">
                                        <span>${product.qty} ${product.unit}</span>
                                        <span class="price">${product.price} ₽</span>
                                        <span class="total">${product.sum} ₽</span>
                                    </div>
                                </div>
                                <div class="product-actions">
                                    <button class="btn btn-success add-to-shopping" data-index="${index}">
                                        <i class="fas fa-shopping-cart"></i>
                                        Добавить в список покупок
                                    </button>
                                    <button class="btn btn-primary already-have" data-index="${index}">
                                        <i class="fas fa-check"></i>
                                        Уже имеется
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="budget-summary">
                        <div class="total-cost">
                            <strong>Общая стоимость:</strong> 
                            <span id="totalCost">${products.reduce((sum, p) => sum + p.sum, 0)} ₽</span>
                        </div>
                        <div class="shopping-cost">
                            <strong>Для покупки:</strong> 
                            <span id="shoppingCost">0 ₽</span>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="cancelProductsChoice">Отмена</button>
                        <button class="btn btn-primary" id="confirmProductsChoice">Продолжить</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Состояние выбора продуктов
        const productChoices = {
            shopping: [],
            alreadyHave: []
        };

        // Обработчики событий
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(null);
        });

        modal.querySelector('#cancelProductsChoice').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(null);
        });

        modal.querySelector('#confirmProductsChoice').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(productChoices);
        });

        // Обработка кнопок выбора
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-shopping') || 
                e.target.closest('.add-to-shopping')) {
                const index = parseInt(e.target.dataset.index || e.target.closest('.add-to-shopping').dataset.index);
                const product = products[index];
                
                // Убираем из уже имеющихся, если был там
                productChoices.alreadyHave = productChoices.alreadyHave.filter(p => p.name !== product.name);
                
                // Добавляем в список покупок
                if (!productChoices.shopping.find(p => p.name === product.name)) {
                    productChoices.shopping.push(product);
                }
                
                updateProductChoiceUI(modal, products, productChoices);
            }
            
            if (e.target.classList.contains('already-have') || 
                e.target.closest('.already-have')) {
                const index = parseInt(e.target.dataset.index || e.target.closest('.already-have').dataset.index);
                const product = products[index];
                
                // Убираем из списка покупок, если был там
                productChoices.shopping = productChoices.shopping.filter(p => p.name !== product.name);
                
                // Добавляем в уже имеющиеся
                if (!productChoices.alreadyHave.find(p => p.name === product.name)) {
                    productChoices.alreadyHave.push(product);
                }
                
                updateProductChoiceUI(modal, products, productChoices);
            }
        });
    });
}

// Обновление UI выбора продуктов
function updateProductChoiceUI(modal, products, productChoices) {
    const totalCost = products.reduce((sum, p) => sum + p.sum, 0);
    const shoppingCost = productChoices.shopping.reduce((sum, p) => sum + p.sum, 0);
    
    modal.querySelector('#totalCost').textContent = `${totalCost} ₽`;
    modal.querySelector('#shoppingCost').textContent = `${shoppingCost} ₽`;
    
    // Обновляем стили кнопок
    products.forEach((product, index) => {
        const item = modal.querySelector(`[data-index="${index}"]`);
        const shoppingBtn = item.querySelector('.add-to-shopping');
        const haveBtn = item.querySelector('.already-have');
        
        const inShopping = productChoices.shopping.find(p => p.name === product.name);
        const inHave = productChoices.alreadyHave.find(p => p.name === product.name);
        
        shoppingBtn.classList.toggle('active', inShopping);
        haveBtn.classList.toggle('active', inHave);
    });
}

// Шаг 5: Обработка выбора пользователя
async function processUserProductChoices(choices, budget, days, meal, start, menu) {
    console.log('📋 Обрабатываем выбор пользователя...');
    
    // Сохраняем уже имеющиеся продукты
    availableIngredients = choices.alreadyHave.map(p => `${p.name} (${p.qty} ${p.unit})`);
    
    // Создаем список покупок
    const shoppingList = choices.shopping;
    
    // Сохраняем данные
    const menuId = Date.now();
    const newMenu = {
        id: menuId,
        budget,
        days,
        meal,
        start,
        items: menu,
        totalCost: shoppingList.reduce((sum, p) => sum + p.sum, 0),
        createdAt: new Date().toISOString(),
        status: 'shopping' // Статус: shopping, cooking, completed
    };

    menus.push(newMenu);
    currentMenu = newMenu;
    currentProducts = shoppingList;
    
    saveUserData();
    updateMenuSelector();
    
    // Показываем список покупок
    showShoppingListDialog(shoppingList, budget, menu);
}

// Показ списка покупок
async function showShoppingListDialog(shoppingList, budget, menu) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Список покупок</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <p>Отметьте купленные продукты. Если продукт не найден, нажмите "Найти аналог":</p>
                
                <div class="shopping-list">
                    ${shoppingList.map((product, index) => `
                        <div class="shopping-item" data-index="${index}">
                            <div class="product-info">
                                <label class="checkbox-container">
                                    <input type="checkbox" class="product-bought" data-index="${index}">
                                    <span class="checkmark"></span>
                                    <strong>${product.name}</strong>
                                </label>
                                <div class="product-details">
                                    <span>${product.qty} ${product.unit}</span>
                                    <span class="price">${product.price} ₽</span>
                                    <span class="total">${product.sum} ₽</span>
                                </div>
                            </div>
                            <div class="product-actions">
                                <button class="btn btn-warning find-analog" data-index="${index}">
                                    <i class="fas fa-search"></i>
                                    Найти аналог
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="shopping-progress">
                    <div class="progress-info">
                        <strong>Куплено:</strong> 
                        <span id="boughtCount">0</span> из <span id="totalCount">${shoppingList.length}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancelShopping">Отмена</button>
                    <button class="btn btn-primary" id="completeShopping" disabled>
                        Разблокировать меню
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Состояние покупок
    const boughtProducts = new Set();
    
    // Обработчики событий
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#cancelShopping').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#completeShopping').addEventListener('click', () => {
        // Разблокируем меню
        unlockMenu(menu);
        document.body.removeChild(modal);
        showMessage('Меню разблокировано! Теперь вы можете готовить.', 'success');
    });

    // Обработка покупок
    modal.addEventListener('change', (e) => {
        if (e.target.classList.contains('product-bought')) {
            const index = parseInt(e.target.dataset.index);
            const product = shoppingList[index];
            
            if (e.target.checked) {
                boughtProducts.add(product.name);
            } else {
                boughtProducts.delete(product.name);
            }
            
            updateShoppingProgress(modal, boughtProducts, shoppingList);
        }
    });

    // Поиск аналогов
    modal.addEventListener('click', async (e) => {
        if (e.target.classList.contains('find-analog') || 
            e.target.closest('.find-analog')) {
            const index = parseInt(e.target.dataset.index || e.target.closest('.find-analog').dataset.index);
            const product = shoppingList[index];
            
            const analog = await findProductAnalog(product);
            if (analog) {
                // Заменяем продукт на аналог
                shoppingList[index] = analog;
                updateShoppingListUI(modal, shoppingList);
                showMessage(`Найден аналог: ${analog.name}`, 'success');
            } else {
                showMessage('Аналог не найден', 'warning');
            }
        }
    });
}

// Поиск аналога продукта через AI
async function findProductAnalog(product) {
    const prompt = `Найди аналог продукта "${product.name}" в каталоге магазина "Макси" в городе Архангельск.

ТРЕБОВАНИЯ:
- Исходный продукт: ${product.name} (${product.qty} ${product.unit})
- Магазин: Макси (Архангельск)
- Найди похожий продукт с аналогичными свойствами
- Учитывай цену (не должна быть значительно выше)
- Продукт должен быть доступен в каталоге Макси

ФОРМАТ ОТВЕТА (строго JSON):
{
  "name": "название аналога из каталога Макси",
  "pack": "описание упаковки",
  "price": цена аналога,
  "unit": "единица измерения",
  "qty": ${product.qty},
  "sum": общая стоимость,
  "available": true
}

Если аналог не найден, верни null.`;

    const response = await callGeminiAPI(prompt);
    return parseJSONResponse(response);
}

// Обновление прогресса покупок
function updateShoppingProgress(modal, boughtProducts, shoppingList) {
    const boughtCount = boughtProducts.size;
    const totalCount = shoppingList.length;
    const progress = (boughtCount / totalCount) * 100;
    
    modal.querySelector('#boughtCount').textContent = boughtCount;
    modal.querySelector('#totalCount').textContent = totalCount;
    modal.querySelector('#progressFill').style.width = `${progress}%`;
    
    // Разблокируем кнопку если все куплено
    const completeBtn = modal.querySelector('#completeShopping');
    completeBtn.disabled = boughtCount < totalCount;
}

// Обновление UI списка покупок
function updateShoppingListUI(modal, shoppingList) {
    const shoppingListContainer = modal.querySelector('.shopping-list');
    shoppingListContainer.innerHTML = shoppingList.map((product, index) => `
        <div class="shopping-item" data-index="${index}">
            <div class="product-info">
                <label class="checkbox-container">
                    <input type="checkbox" class="product-bought" data-index="${index}">
                    <span class="checkmark"></span>
                    <strong>${product.name}</strong>
                </label>
                <div class="product-details">
                    <span>${product.qty} ${product.unit}</span>
                    <span class="price">${product.price} ₽</span>
                    <span class="total">${product.sum} ₽</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-warning find-analog" data-index="${index}">
                    <i class="fas fa-search"></i>
                    Найти аналог
                </button>
            </div>
        </div>
    `).join('');
}

// Разблокировка меню
function unlockMenu(menu) {
    currentMenu.status = 'cooking';
    currentMenu.items = menu;
    saveUserData();
    updateMenuUI();
}

// Парсинг JSON ответа
function parseJSONResponse(response) {
    if (!response) return null;
    
    try {
        // Сначала пытаемся найти JSON в коде блока
        const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            return JSON.parse(codeBlockMatch[1]);
        }
        
        // Если нет кода блока, пытаемся распарсить весь ответ
        return JSON.parse(response);
    } catch (error) {
        console.error('❌ Ошибка парсинга JSON:', error);
        console.log('📄 Ответ:', response);
        return null;
    }
}

// Инициализация Supabase
async function initSupabase() {
    console.log('🚀 Начинаем инициализацию Supabase...');
    console.log('SUPABASE_CONFIG:', window.SUPABASE_CONFIG);
    
    // Проверяем, есть ли реальная конфигурация Supabase (не заглушки)
    if (window.SUPABASE_CONFIG && 
        window.SUPABASE_CONFIG.url && 
        window.SUPABASE_CONFIG.anonKey &&
        window.SUPABASE_CONFIG.url !== 'https://your-project.supabase.co' &&
        window.SUPABASE_CONFIG.anonKey !== 'your-anon-key-here') {
        
        try {
            console.log('🔧 Создаем SupabaseClient...');
            console.log('SupabaseClient доступен:', typeof SupabaseClient);
            
            if (typeof SupabaseClient !== 'function') {
                throw new Error('SupabaseClient не загружен');
            }
            
            supabaseClient = new SupabaseClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            
            console.log('🔌 Подключаемся к Supabase...');
            const isConnected = await supabaseClient.init();
            
            if (isConnected) {
                console.log('✅ Supabase подключен успешно');
                await supabaseClient.createTables();
                return { success: true, message: 'Supabase подключен' };
            } else {
                throw new Error('Не удалось подключиться к Supabase');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации Supabase:', error);
            supabaseClient = null;
            return { success: false, message: error.message };
        }
    } else {
        console.log('⚠️ Конфигурация Supabase не найдена, используем localStorage');
        supabaseClient = null;
        return { success: false, message: 'Используем localStorage' };
    }
}

// Проверка авторизации
async function checkAuth() {
    console.log('🔐 Проверяем авторизацию...');
    
    try {
        if (supabaseClient && supabaseClient.initialized) {
            // Проверяем сессию в Supabase
            const session = await supabaseClient.getSession();
            if (session) {
                console.log('✅ Найдена активная сессия в Supabase');
                currentUser = session.user;
                await loadUserData();
                showMainApp();
                return;
            }
        } else {
            // Проверяем localStorage
<<<<<<< HEAD
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
        currentUser = JSON.parse(savedUser);
                    console.log('✅ Найден пользователь в localStorage:', currentUser.email);
                    await loadUserData();
                    showMainApp();
                    return;
<<<<<<< HEAD
                } catch (error) {
                    console.error('❌ Ошибка парсинга пользователя из localStorage:', error);
                    localStorage.removeItem('currentUser');
>>>>>>> main
                }
            }
        }
        
        // Показываем экран авторизации
        showAuthScreen();
        
    } catch (error) {
        console.error('❌ Ошибка проверки авторизации:', error);
        showAuthScreen();
    }
}

// Показ экрана авторизации
function showAuthScreen() {
    console.log('🔐 Показываем экран авторизации...');
    
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;
    
    appContainer.innerHTML = `
        <div class="auth-screen">
            <div class="auth-card">
                <div class="auth-header">
                    <h1 class="app-title">Flash Menu</h1>
                    <p class="auth-subtitle">Умный планировщик покупок и меню</p>
                </div>
                
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Вход</button>
                    <button class="auth-tab" data-tab="register">Регистрация</button>
                </div>
                
                <!-- Форма входа -->
                <form id="loginForm" class="auth-form active">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Пароль</label>
                        <input type="password" class="form-input" id="loginPassword" required>
                    </div>
                    <div class="form-error" id="loginError"></div>
                    <button type="submit" class="btn btn-primary btn-large">
                        <i class="fas fa-sign-in-alt"></i>
                        Войти
                    </button>
                </form>
                
                <!-- Форма регистрации -->
                    <div class="form-group">
                        <label class="form-label">Имя</label>
                        <input type="text" class="form-input" id="registerName" required>
                    </div>
<<<<<<< HEAD
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="registerEmail" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Пароль</label>
                        <input type="password" class="form-input" id="registerPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Подтвердите пароль</label>
                        <input type="password" class="form-input" id="registerPasswordConfirm" required minlength="6">
                    </div>
                    <div class="form-error" id="registerError"></div>
                    <button type="submit" class="btn btn-primary btn-large">
                        <i class="fas fa-user-plus"></i>
                        Зарегистрироваться
                    </button>
    <div class="form-group">
                <label class="form-label">Email</label>
    <input type="email" class="form-input" id="registerEmail" required>
    </div>
    <div class="form-group">
                <label class="form-label">Пароль</label>
    <input type="password" class="form-input" id="registerPassword" required minlength="6">
    </div>
    <div class="form-group">
                <label class="form-label">Подтвердите пароль</label>
                        <input type="password" class="form-input" id="registerPasswordConfirm" required minlength="6">
    </div>
                </form>
            </div>
        </div>
    `;
    
    // Обработчики событий
    setupAuthEventListeners();
}

// Настройка обработчиков авторизации
function setupAuthEventListeners() {
    // Переключение табов
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Обновляем активный таб
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Показываем соответствующую форму
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetTab}Form`) {
                    form.classList.add('active');
                }
            });
            
            // Очищаем ошибки
            document.getElementById('loginError').textContent = '';
            document.getElementById('registerError').textContent = '';
        });
    });
    
    // Обработка входа
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // Обработка регистрации
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', handleRegister);
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    // Очищаем предыдущие ошибки
    errorElement.textContent = '';
    
    if (!email || !password) {
        errorElement.textContent = 'Пожалуйста, заполните все поля';
        return;
    }
    
    try {
        console.log('🔐 Попытка входа для:', email);
        
        // Вход через localStorage (так как Supabase не настроен)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            errorElement.textContent = 'Пользователь не найден';
            return;
        }
        
        if (user.password !== password) {
            errorElement.textContent = 'Неверный пароль';        return;
=======
        return;
    }
    
>>>>>>> main
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        await loadUserData();
        showMainApp();
        showMessage('Вход выполнен успешно!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        errorElement.textContent = 'Произошла ошибка при входе';
    }
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const errorElement = document.getElementById('registerError');
    
    // Очищаем предыдущие ошибки
    errorElement.textContent = '';
    
    // Валидация
    if (!name || !email || !password || !passwordConfirm) {
        errorElement.textContent = 'Пожалуйста, заполните все поля';
        return;
    }
    
    if (password !== passwordConfirm) {
        errorElement.textContent = 'Пароли не совпадают';
        return;
    }
    
    if (password.length < 6) {
        errorElement.textContent = 'Пароль должен содержать минимум 6 символов';
        return;
    }
    
    if (!isValidEmail(email)) {
        errorElement.textContent = 'Введите корректный email';
        return;
    }
    
    try {
        console.log('📝 Попытка регистрации для:', email);
        

        // Регистрация через localStorage (так как Supabase не настроен)
            const users = JSON.parse(localStorage.getItem('users') || '[]');            // Проверяем, не существует ли уже пользователь
            return;
        }
        
        // Создаем нового пользователя
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            errorElement.textContent = 'Пользователь с таким email уже существует';
                return;
            }
        const newUser = {id: Date.now().toString(),name,email,password,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
>>>>>>> main
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        await loadUserData();
        showMainApp();
        showMessage('Регистрация выполнена успешно!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        errorElement.textContent = 'Произошла ошибка при регистрации';
    }
}

// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Показ основного приложения
function showMainApp() {
    console.log('🏠 Показываем основное приложение...');
    
    const appContainer = document.querySelector('.app-container');
    if (!appContainer) return;
    
    appContainer.innerHTML = `
        <div class="app-header">
            <div class="header-content">
                <h1 class="app-title">Flash Menu</h1>
                <div class="user-menu">
                    <button class="user-menu-btn" id="userMenuBtn">
                        <i class="fas fa-user-circle"></i>
                        <span>${currentUser.name || currentUser.email}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-item" id="profileBtn">
                            <i class="fas fa-user"></i>
                            Личный кабинет
                        </div>
                        <div class="dropdown-item" id="settingsBtn">
                            <i class="fas fa-cog"></i>
                            Настройки
                        </div>
                        <div class="dropdown-divider"></div>
                        <div class="dropdown-item" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            Выйти
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="app-content">
            <nav class="nav-tabs">
                <button class="nav-tab active" data-tab="settings">
                    <i class="fas fa-magic"></i>
                    Генерация меню
                </button>
                <button class="nav-tab" data-tab="shopping">
                    <i class="fas fa-shopping-basket"></i>
                    Покупки
                </button>
                <button class="nav-tab" data-tab="menu">
                    <i class="fas fa-book-open"></i>
                    Меню
                </button>
            </nav>

            <!-- Секция настроек -->
            <div id="settings" class="section active">
                <div class="card">
                    <h2 class="card-title">
                        <i class="fas fa-magic"></i>
                        Генерация меню
                    </h2>
                    <form id="menuForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Бюджет (₽)</label>
                                <input type="number" class="form-input" id="budget" min="500" placeholder="Введите бюджет" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Срок (дни)</label>
                                <select class="form-input" id="days" required>
                                    <option value="1">1 день</option>
                                    <option value="3">3 дня</option>
                                    <option value="5">5 дней</option>
                                    <option value="7">7 дней</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Начало</label>
                                <select class="form-input" id="start" required>
                                    <option value="Сегодня с ужина">Сегодня с ужина</option>
                                    <option value="Завтра с завтрака">Завтра с завтрака</option>
                                    <option value="Сегодня с завтрака">Сегодня с завтрака</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Приём пищи</label>
                                <select class="form-input" id="meal" required>
                                    <option value="Все">Все приёмы пищи</option>
                                    <option value="Завтрак">Завтрак</option>
                                    <option value="Обед">Обед</option>
                                    <option value="Ужин">Ужин</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-large">
                            <i class="fas fa-magic"></i>
                            Сгенерировать меню
                        </button>
                    </form>
                </div>
            </div>

            <!-- Секция покупок -->
            <div id="shopping" class="section">
                <div class="card">
                    <h2 class="card-title">
                        <i class="fas fa-shopping-basket"></i>
                        Список покупок
                    </h2>
                    <div id="shoppingContent">
                        <p>Сначала сгенерируйте меню</p>
                    </div>
                </div>
            </div>

            <!-- Секция меню -->
            <div id="menu" class="section">
                <div class="card">
                    <h2 class="card-title">
                        <i class="fas fa-book-open"></i>
                        Меню
                    </h2>
                    <div class="menu-selector">
                        <select class="menu-select" id="menuSelector">
                            <option value="">Выберите меню</option>
                        </select>
                    </div>
                    <div id="menuContent">
                        <p>Сначала сгенерируйте меню</p>
                    </div>
                </div>
            </div>

            <!-- Индикатор загрузки -->
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <div>Генерация меню...</div>
            </div>
        </div>
    `;
    
    // Настройка обработчиков событий
    setupMainAppEventListeners();
    
    // Загружаем данные
    loadUserData();
    updateUI();
}

// Настройка обработчиков основного приложения
function setupMainAppEventListeners() {
    // Переключение табов
    const navTabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.section');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Обновляем активный таб
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Показываем соответствующую секцию
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetTab) {
                    section.classList.add('active');
                }
            });
        });
    });
    
    // Меню пользователя
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    userMenuBtn.addEventListener('click', () => {
        userDropdown.classList.toggle('active');
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Обработчики меню пользователя
    document.getElementById('profileBtn').addEventListener('click', showUserProfile);
    document.getElementById('settingsBtn').addEventListener('click', showUserSettings);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Форма генерации меню
    const menuForm = document.getElementById('menuForm');
    menuForm.addEventListener('submit', generateMenu);
}

// Показ профиля пользователя
function showUserProfile() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>Личный кабинет</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="profile-sections">
                    <div class="profile-section">
                        <h4>Основная информация</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Имя</label>
                                <input type="text" class="form-input" id="profileName" value="${userProfile.name}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-input" id="profileEmail" value="${userProfile.email}" readonly>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Возраст</label>
                                <input type="number" class="form-input" id="profileAge" value="${userProfile.age}" min="1" max="120">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Вес (кг)</label>
                                <input type="number" class="form-input" id="profileWeight" value="${userProfile.weight}" min="30" max="200">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Рост (см)</label>
                                <input type="number" class="form-input" id="profileHeight" value="${userProfile.height}" min="100" max="250">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Уровень активности</label>
                                <select class="form-input" id="profileActivity">
                                    <option value="low" ${userProfile.activity === 'low' ? 'selected' : ''}>Низкий</option>
                                    <option value="moderate" ${userProfile.activity === 'moderate' ? 'selected' : ''}>Средний</option>
                                    <option value="high" ${userProfile.activity === 'high' ? 'selected' : ''}>Высокий</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h4>Пищевые предпочтения</h4>
                        <div class="preferences-grid">
                            <label class="checkbox-container">
                                <input type="checkbox" id="prefVegetarian" ${userProfile.preferences.vegetarian ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Вегетарианство
                            </label>
                            <label class="checkbox-container">
                                <input type="checkbox" id="prefVegan" ${userProfile.preferences.vegan ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Веганство
                            </label>
                            <label class="checkbox-container">
                                <input type="checkbox" id="prefGlutenFree" ${userProfile.preferences.glutenFree ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Без глютена
                            </label>
                            <label class="checkbox-container">
                                <input type="checkbox" id="prefLactoseFree" ${userProfile.preferences.lactoseFree ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Без лактозы
                            </label>
                            <label class="checkbox-container">
                                <input type="checkbox" id="prefSpicy" ${userProfile.preferences.spicy ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Острая пища
                            </label>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h4>Цели</h4>
                        <div class="goals-grid">
                            <label class="checkbox-container">
                                <input type="checkbox" id="goalWeightLoss" ${userProfile.goals.weightLoss ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Похудение
                            </label>
                            <label class="checkbox-container">
                                <input type="checkbox" id="goalWeightGain" ${userProfile.goals.weightGain ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Набор веса
                            </label>
                            <label class="checkbox-container">
                                <input type="checkbox" id="goalMaintenance" ${userProfile.goals.maintenance ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Поддержание веса
                            </label>
                            <label class="checkbox-container">
                                <input type="checkbox" id="goalMuscleGain" ${userProfile.goals.muscleGain ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Набор мышечной массы
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancelProfile">Отмена</button>
                    <button class="btn btn-primary" id="saveProfile">Сохранить</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Обработчики событий
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#cancelProfile').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#saveProfile').addEventListener('click', () => {
        saveUserProfile(modal);
        document.body.removeChild(modal);
        showMessage('Профиль сохранен!', 'success');
    });
}

// Сохранение профиля пользователя
function saveUserProfile(modal) {
    // Основная информация
    userProfile.name = modal.querySelector('#profileName').value;
    userProfile.email = modal.querySelector('#profileEmail').value;
    userProfile.age = parseInt(modal.querySelector('#profileAge').value);
    userProfile.weight = parseFloat(modal.querySelector('#profileWeight').value);
    userProfile.height = parseInt(modal.querySelector('#profileHeight').value);
    userProfile.activity = modal.querySelector('#profileActivity').value;
    
    // Предпочтения
    userProfile.preferences.vegetarian = modal.querySelector('#prefVegetarian').checked;
    userProfile.preferences.vegan = modal.querySelector('#prefVegan').checked;
    userProfile.preferences.glutenFree = modal.querySelector('#prefGlutenFree').checked;
    userProfile.preferences.lactoseFree = modal.querySelector('#prefLactoseFree').checked;
    userProfile.preferences.spicy = modal.querySelector('#prefSpicy').checked;
    
    // Цели
    userProfile.goals.weightLoss = modal.querySelector('#goalWeightLoss').checked;
    userProfile.goals.weightGain = modal.querySelector('#goalWeightGain').checked;
    userProfile.goals.maintenance = modal.querySelector('#goalMaintenance').checked;
    userProfile.goals.muscleGain = modal.querySelector('#goalMuscleGain').checked;
    
    // Сохраняем в базу
    saveUserData();
    
    // Обновляем отображение имени пользователя
    const userNameSpan = document.querySelector('.user-menu-btn span');
    if (userNameSpan) {
        userNameSpan.textContent = userProfile.name || currentUser.email;
    }
}

// Показ настроек пользователя
function showUserSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Настройки</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4>Безопасность</h4>
                    <button class="btn btn-secondary" id="changePasswordBtn">
                        <i class="fas fa-key"></i>
                        Изменить пароль
                    </button>
                </div>
                
                <div class="settings-section">
                    <h4>Данные</h4>
                    <button class="btn btn-warning" id="clearDataBtn">
                        <i class="fas fa-trash"></i>
                        Очистить все данные
                    </button>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancelSettings">Закрыть</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Обработчики событий
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#cancelSettings').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#changePasswordBtn').addEventListener('click', () => {
        showChangePasswordDialog();
    });

    modal.querySelector('#clearDataBtn').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите очистить ВСЕ данные? Это действие нельзя отменить!')) {
            clearAllUserData();
            document.body.removeChild(modal);
            showMessage('Все данные очищены', 'success');
        }
    });
}

// Диалог смены пароля
function showChangePasswordDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Изменение пароля</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Текущий пароль</label>
                    <input type="password" class="form-input" id="currentPassword" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Новый пароль</label>
                    <input type="password" class="form-input" id="newPassword" required minlength="6">
                </div>
                <div class="form-group">
                    <label class="form-label">Подтвердите новый пароль</label>
                    <input type="password" class="form-input" id="confirmNewPassword" required minlength="6">
                </div>
                <div class="form-error" id="passwordError"></div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="cancelPassword">Отмена</button>
                    <button class="btn btn-primary" id="savePassword">Сохранить</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Обработчики событий
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#cancelPassword').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('#savePassword').addEventListener('click', async () => {
        const currentPassword = modal.querySelector('#currentPassword').value;
        const newPassword = modal.querySelector('#newPassword').value;
        const confirmNewPassword = modal.querySelector('#confirmNewPassword').value;
        const errorElement = modal.querySelector('#passwordError');
        
        errorElement.textContent = '';
        
        // Валидация
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            errorElement.textContent = 'Заполните все поля';
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            errorElement.textContent = 'Пароли не совпадают';
            return;
        }
        
        if (newPassword.length < 6) {
            errorElement.textContent = 'Новый пароль должен содержать минимум 6 символов';
            return;
    }
>>>>>>> main
        
        try {
            // Смена пароля через localStorage (так как Supabase не настроен)
            if (currentUser.password !== currentPassword) {
                errorElement.textContent = 'Неверный текущий пароль';
                return;
            }
            
            // Обновляем пароль
            currentUser.password = newPassword;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Обновляем в списке пользователей
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex >= 0) {
                users[userIndex].password = newPassword;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            document.body.removeChild(modal);
            showMessage('Пароль изменен успешно!', 'success');
        } catch (error) {
            console.error('❌ Ошибка смены пароля:', error);
            errorElement.textContent = 'Произошла ошибка при смене пароля';
        }
    });
}

// Выход из системы
function handleLogout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        // Очищаем текущего пользователя
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Очищаем данные
        menus = [];
        currentProducts = [];
        boughtProducts = [];
        availableIngredients = [];
        
        // Показываем экран авторизации
        showAuthScreen();
        showMessage('Вы вышли из системы', 'info');
    }
} 

// Загрузка данных пользователя
async function loadUserData() {
    console.log('📂 Загружаем данные пользователя...');
    
    try {
        // Загружаем данные из localStorage (так как Supabase не настроен)
        const userData = safeJsonParse(localStorage.getItem(`userData_${currentUser.id}`), {});
        
        menus = userData.menus || [];
        currentProducts = userData.currentProducts || [];
        boughtProducts = userData.boughtProducts || [];
        availableIngredients = userData.availableIngredients || [];
        userProfile = userData.userProfile || userProfile;
        
        console.log('✅ Данные пользователя загружены');
        console.log('📋 Меню:', menus.length);
        console.log('🛒 Продукты:', currentProducts.length);
        console.log('✅ Купленные:', boughtProducts.length);
        console.log('🥘 Ингредиенты:', availableIngredients.length);
<<<<<<< HEAD
    }    } catch (error) {
        console.error('❌ Ошибка загрузки данных пользователя:', error);
        // Используем пустые значения по умолчанию
        menus = [];
        currentProducts = [];
        boughtProducts = [];
        availableIngredients = [];
    }
}

// Сохранение данных пользователя
async function saveUserData() {
    console.log('💾 Сохраняем данные пользователя...');
    
    if (!currentUser) {
        console.warn('⚠️ Нет текущего пользователя для сохранения');
        return;
    }
    
    const userData = {
        menus,
        currentProducts,
        boughtProducts,
        availableIngredients,
        userProfile,
        updatedAt: new Date().toISOString()
    };
    
    try {
        // Сохраняем в localStorage (так как Supabase не настроен)
        localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
        
        console.log('✅ Данные пользователя сохранены');
        
    } catch (error) {
        console.error('❌ Ошибка сохранения данных пользователя:', error);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('🔧 Настраиваем обработчики событий...');
    
    // Обработчики уже настроены в showAuthScreen() и showMainApp()
    console.log('✅ Обработчики событий настроены');
}

// Тестирование API ключа
function testApiKey() {
    console.log('🔑 Тестируем API ключ...');
    
    // Проверяем наличие API ключей
    const hasApiKeys = window.GEMINI_API_KEY_1 && 
                      window.GEMINI_API_KEY_1 !== '[ВАШ_API_КЛЮЧ]' &&
                      window.GEMINI_API_KEY_1 !== '[ВАШ_API_КЛЮЧ_1]';
    
    if (hasApiKeys) {
        console.log('✅ API ключи найдены');
    } else {
        console.log('⚠️ API ключи не найдены, будет использоваться Mock режим');
    }
}

// Очистка поврежденных данных
function clearCorruptedData() {
    console.log('🧹 Очищаем поврежденные данные...');
    
    try {
        // Проверяем и очищаем localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                if (value && (key.includes('userData') || key.includes('currentUser') || key.includes('users'))) {
                    JSON.parse(value);
                }
            } catch (error) {
                console.log(`🗑️ Удаляем поврежденные данные: ${key}`);
                localStorage.removeItem(key);
            }
        });
        
        console.log('✅ Поврежденные данные очищены');
        
    } catch (error) {
        console.error('❌ Ошибка очистки поврежденных данных:', error);
    }
}

// Безопасный парсинг JSON
function safeJsonParse(jsonString, defaultValue = null) {
    if (!jsonString) return defaultValue;
    
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('⚠️ Ошибка парсинга JSON:', error);
        return defaultValue;
    }
}

// Очистка всех данных пользователя
function clearAllUserData() {
    console.log('🗑️ Очищаем все данные пользователя...');
    
    // Очищаем переменные
    menus = [];
    currentProducts = [];
    boughtProducts = [];
    availableIngredients = [];
    
    // Очищаем localStorage
    if (currentUser) {
        localStorage.removeItem(`userData_${currentUser.id}`);
    }
    localStorage.removeItem('currentUser');
    
    // Очищаем Supabase (если бы был настроен)
    // if (supabaseClient && supabaseClient.initialized) {
    //     supabaseClient.clearUserData(currentUser?.id);
    // }
    
    console.log('✅ Все данные пользователя очищены');
}

// Показать/скрыть загрузку
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('active', show);
    }
}

// Показать сообщение
function showMessage(text, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${text}`);
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${text}
    `;
    
    // Добавляем сообщение в контейнер
    const container = document.querySelector('.app-content') || document.querySelector('.auth-screen');
    if (container) {
        container.insertBefore(message, container.firstChild);
        
        // Удаляем сообщение через 5 секунд
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
}

// Обновление UI
function updateUI() {
    console.log('🎨 Обновляем UI...');
    
    // Обновляем селектор меню
    updateMenuSelector();
    
    // Обновляем отображение покупок
    updateShoppingUI();
    
    // Обновляем отображение меню
    updateMenuUI();
    
    console.log('✅ UI обновлен');
}

// Обновление селектора меню
function updateMenuSelector() {
    const menuSelector = document.getElementById('menuSelector');
    if (!menuSelector) return;
    
    // Очищаем текущие опции
    menuSelector.innerHTML = '<option value="">Выберите меню</option>';
    
    // Добавляем все сохраненные меню
    menus.forEach((menu, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Меню ${index + 1} (${menu.budget} ₽, ${menu.days} дн.)`;
        menuSelector.appendChild(option);
    });
    
    // Устанавливаем текущее меню как выбранное
    if (currentMenu) {
        const currentIndex = menus.findIndex(menu => menu.id === currentMenu.id);
        if (currentIndex >= 0) {
            menuSelector.value = currentIndex;
        }
    }
    
    // Добавляем обработчик изменения
    menuSelector.addEventListener('change', (e) => {
        const selectedIndex = parseInt(e.target.value);
        if (selectedIndex >= 0 && selectedIndex < menus.length) {
            currentMenu = menus[selectedIndex];
            updateMenuUI();
        }
    });
}

// Обновление UI покупок
function updateShoppingUI() {
    const shoppingContent = document.getElementById('shoppingContent');
    if (!shoppingContent) return;
    
    if (currentProducts.length === 0) {
        shoppingContent.innerHTML = '<p>Сначала сгенерируйте меню</p>';
        return;
    }

    shoppingContent.innerHTML = `
        <div class="available-ingredients">
            <div class="ingredients-title">Имеющиеся ингредиенты:</div>
            <div class="ingredients-list">${availableIngredients.length > 0 ? availableIngredients.join(', ') : 'Нет доступных ингредиентов'}</div>
        </div>
        
        <div class="search-box">
            <input type="text" class="search-input" id="searchProducts" placeholder="Поиск по продуктам...">
        </div>
        
        <div id="productsList"></div>
        
        <div class="total-sum" id="totalSum"></div>
        
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        
        <button class="btn btn-success" id="markAllBought">У меня есть все продукты</button>
        <button class="btn btn-danger" id="resetList">Сбросить список</button>
        <button class="btn btn-warning" id="clearAllData">Очистить все данные</button>
    `;

    // Добавить обработчики для новых элементов
    document.getElementById('searchProducts')?.addEventListener('input', filterProducts);
    document.getElementById('markAllBought')?.addEventListener('click', markAllAsBought);
    document.getElementById('resetList')?.addEventListener('click', resetShoppingList);
    document.getElementById('clearAllData')?.addEventListener('click', clearAllUserData);

    renderProductsList();
}

// Рендеринг списка продуктов
function renderProductsList() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;

    // Список продуктов
    productsList.innerHTML = '';
    currentProducts.forEach((product, index) => {
        if (!boughtProducts.includes(index)) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <input type="checkbox" class="checkbox" data-index="${index}">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-details">${product.pack} • ${product.qty} ${product.unit}</div>
                </div>
                <div class="product-price">${product.sum.toFixed(2)} ₽</div>
            `;
            
            productCard.querySelector('.checkbox').addEventListener('change', (e) => {
                if (e.target.checked) {
                    boughtProducts.push(index);
                    availableIngredients.push(`${product.name} (${product.qty} ${product.unit})`);
                } else {
                    const idx = boughtProducts.indexOf(index);
                    if (idx > -1) {
                        boughtProducts.splice(idx, 1);
                        const ingredientIdx = availableIngredients.findIndex(ing => ing.includes(product.name));
                        if (ingredientIdx > -1) {
                            availableIngredients.splice(ingredientIdx, 1);
                        }
                    }
                }
                saveUserData();
                renderProductsList();
                updateMenuStatus();
            });
            
            productsList.appendChild(productCard);
        }
    });

    // Общая сумма
    const totalSum = document.getElementById('totalSum');
    if (totalSum) {
        const totalCost = boughtProducts.reduce((sum, index) => sum + currentProducts[index].sum, 0);
        totalSum.innerHTML = `Итого куплено: <strong>${totalCost.toFixed(2)} ₽</strong>`;
    }

    // Прогресс-бар
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const progress = currentProducts.length > 0 ? (boughtProducts.length / currentProducts.length) * 100 : 0;
        progressFill.style.width = `${progress}%`;
>>>>>>> main
        progressFill.style.backgroundColor = progress === 100 ? '#10b981' : '#6366f1';
    }
}

// Фильтрация продуктов
function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        if (productName.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Отметка всех продуктов как купленных
function markAllAsBought() {
    currentProducts.forEach((product, index) => {
        if (!boughtProducts.includes(index)) {
            boughtProducts.push(index);
            availableIngredients.push(`${product.name} (${product.qty} ${product.unit})`);
        }
    });
    
    saveUserData();
    renderProductsList();
    showMessage('Все продукты отмечены как купленные!', 'success');
}

// Сброс списка покупок
function resetShoppingList() {
    boughtProducts = [];
    saveUserData();
    renderProductsList();
    showMessage('Список покупок сброшен!', 'success');
}

// Обновление UI меню
function updateMenuUI() {
    const menuContent = document.getElementById('menuContent');
    if (!menuContent) return;
    
    if (menus.length === 0) {
        menuContent.innerHTML = '<p>Сначала сгенерируйте меню</p>';
        return;
    }

    // Используем последнее сгенерированное меню
    currentMenu = menus[menus.length - 1];

    // Проверяем статус меню
    const isMenuLocked = currentMenu.status === 'shopping' || currentMenu.status === undefined;
    const menuClass = isMenuLocked ? 'menu-locked' : '';

    menuContent.innerHTML = `
        <div class="menu-header">
            <h3>Меню на ${currentMenu.days} дней (${currentMenu.meal})</h3>
            <p>Бюджет: ${currentMenu.totalCost} ₽</p>
            <div class="menu-status" id="menuStatus">
                <span class="status-indicator ${isMenuLocked ? 'inactive' : 'active'}">
                    ${isMenuLocked ? '🔒 Меню заблокировано' : '✅ Меню активно'}
                </span>
            </div>
        </div>
        
        <div id="menuItems" class="${menuClass}"></div>
        
        <div class="menu-actions">
            <button class="btn btn-success" id="generateNewMenu">Сгенерировать новое меню</button>
            ${isMenuLocked ? '<button class="btn btn-primary" id="continueShopping">Продолжить покупки</button>' : ''}
        </div>
    `;

    // Добавить обработчики
    document.getElementById('generateNewMenu').addEventListener('click', () => {
        const navTabs = document.querySelectorAll('.nav-tab');
        const sections = document.querySelectorAll('.section');
        
        navTabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        document.querySelector('[data-tab="settings"]').classList.add('active');
        document.getElementById('settings').classList.add('active');
    });
    
    const continueShoppingBtn = document.getElementById('continueShopping');
    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', () => {
            showShoppingListDialog(currentProducts, currentMenu.budget, currentMenu.items);
        });
    }

    renderMenuItems();
    updateMenuStatus();
}

// Обновление статуса меню
function updateMenuStatus() {
    const menuStatus = document.getElementById('menuStatus');
    if (!menuStatus) return;
    
    // Проверяем, куплены ли все продукты
    const allProductsBought = currentProducts.length > 0 && boughtProducts.length === currentProducts.length;
    
    if (allProductsBought) {
        menuStatus.innerHTML = '<span class="status-indicator active">✅ Все продукты куплены! Меню активно</span>';
    } else {
        const boughtCount = boughtProducts.length;
        const totalCount = currentProducts.length;
        menuStatus.innerHTML = `<span class="status-indicator inactive">⏳ Куплено ${boughtCount} из ${totalCount} продуктов</span>`;
    }
}

// Рендеринг элементов меню
function renderMenuItems() {
    const menuItems = document.getElementById('menuItems');
    if (!menuItems) return;
    
    if (!currentMenu) {
        menuItems.innerHTML = '<p>Нет доступного меню</p>';
        return;
    }

    menuItems.innerHTML = '';
    
    if (!currentMenu.items || currentMenu.items.length === 0) {
        menuItems.innerHTML = '<p>В меню нет блюд</p>';
        return;
    }

    // Группируем блюда по дням
    const dishesByDay = {};
    currentMenu.items.forEach(item => {
        if (!dishesByDay[item.day]) {
            dishesByDay[item.day] = [];
        }
        dishesByDay[item.day].push(item);
    });

    // Проверяем статус покупок
    const allProductsBought = currentProducts.length > 0 && boughtProducts.length === currentProducts.length;

    // Рендерим каждый день
    Object.keys(dishesByDay).forEach(day => {
        const daySection = document.createElement('div');
        daySection.className = 'day-section';
        daySection.innerHTML = `
            <h4 class="day-title">${day}</h4>
            <div class="day-meals">
                ${dishesByDay[day].map((item, index) => `
                    <div class="meal-card ${allProductsBought ? 'active' : 'inactive'}" data-day="${day}" data-meal="${item.meal}">
                        <div class="meal-header">
                            <h5>${item.meal}</h5>
                            ${item.cookingTime ? `<span class="cooking-time">⏱️ ${item.cookingTime} мин</span>` : ''}
<<<<<<< HEAD
    </div>
            </div>
                        <div class="meal-preview">
                            <p class="recipe-preview">${item.recipe.substring(0, 100)}${item.recipe.length > 100 ? '...' : ''}</p>
            </div>
>>>>>>> main
                        ${allProductsBought ? `
                            <button class="btn btn-primary btn-sm start-cooking" data-day="${day}" data-meal="${item.meal}">
                                🍳 Начать готовить
                            </button>
                        ` : `
                            <div class="meal-locked">
                                🔒 Купите продукты для разблокировки
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        `;
        
        menuItems.appendChild(daySection);
    });

    // Добавляем обработчики для кнопок готовки
    document.querySelectorAll('.start-cooking').forEach(button => {
        button.addEventListener('click', (e) => {
            const day = e.target.dataset.day;
            const meal = e.target.dataset.meal;
            showMealDetails(day, meal);
        });
    });

    // Добавляем обработчики для карточек блюд
    document.querySelectorAll('.meal-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('start-cooking')) {
                const day = card.dataset.day;
                const meal = card.dataset.meal;
                showMealDetails(day, meal);
            }
        });
    });
}

// Показ деталей блюда
function showMealDetails(day, meal) {
    const mealItem = currentMenu.items.find(item => item.day === day && item.meal === meal);
    if (!mealItem) return;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${day} - ${meal}</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="recipe-section">
                    <h4>Рецепт</h4>
                    <p>${mealItem.recipe}</p>
                </div>
                
                <div class="ingredients-section">
                    <h4>Ингредиенты</h4>
                    <ul>
                        ${mealItem.ingredients.map(ing => `
                            <li>${ing.name} - ${ing.qty} ${ing.unit}</li>
                        `).join('')}
                    </ul>
                </div>
                
                ${mealItem.cookingTime ? `
                    <div class="cooking-section">
                        <h4>Время приготовления: ${mealItem.cookingTime} минут</h4>
                        <button class="btn btn-success start-timer" data-time="${mealItem.cookingTime}">
                            ⏰ Запустить таймер
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Обработчики
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.querySelector('.start-timer')?.addEventListener('click', (e) => {
        const time = parseInt(e.target.dataset.time);
        startTimer(time);
        document.body.removeChild(modal);
    });

    // Закрытие по клику вне модала
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Запуск таймера
function startTimer(minutes) {
    if (activeTimer) {
        clearInterval(activeTimer);
    }

    let timeLeft = minutes * 60;

    // Создаем таймер если его нет
    let timer = document.getElementById('timer');
    if (!timer) {
        const timerHTML = `
            <div class="timer active" id="timer">
                <div class="timer-display" id="timerDisplay">${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}</div>
                <button class="btn btn-primary" id="stopTimer">Остановить таймер</button>
            </div>
        `;
        document.querySelector('.app-content').insertAdjacentHTML('beforeend', timerHTML);
        
        document.getElementById('stopTimer').addEventListener('click', stopTimer);
    } else {
        timer.classList.add('active');
    }

    activeTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(activeTimer);
            activeTimer = null;
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.classList.remove('active');
            }
            
            // Уведомление
            if (Notification.permission === 'granted') {
                new Notification('Время готовки!', {
                    body: 'Ваше блюдо готово!',
                    icon: '/favicon.ico'
                });
            } else {
                alert('Время готовки! Ваше блюдо готово!');
            }
        }
        
        timeLeft--;
    }, 1000);
}

// Остановка таймера
function stopTimer() {
    if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
    }
    const timer = document.getElementById('timer');
    if (timer) {
        timer.classList.remove('active');
    }
}

// Запрос разрешения на уведомления
if ('Notification' in window) {
    Notification.requestPermission();
} 