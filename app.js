// Конфигурация API
const API_CONFIG = {
    // Зашифрованный API ключ (базовое шифрование для демо)
    encryptedKey: 'QWl6YVN5REtWTTJxSlE0bFhmalpwUVZtOXlteGZfR2l3TWtEQ0hz',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

// Функция для получения API ключа
function getApiKey() {
    try {
        // Простое дешифрование (в реальном проекте используйте более сложные методы)
        const decryptedKey = atob(API_CONFIG.encryptedKey);
        console.log('API Key decrypted successfully');
        return decryptedKey;
    } catch (error) {
        console.error('Ошибка получения API ключа:', error);
        return null;
    }
}

// Состояние приложения
let currentUser = null;
let currentMenu = null;
let currentProducts = [];
let boughtProducts = [];
let availableIngredients = [];
let menus = [];
let activeTimer = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Тестируем API ключ
    testApiKey();
    
    checkAuth();
    setupEventListeners();
});

// Тестирование API ключа
function testApiKey() {
    const apiKey = getApiKey();
    console.log('=== API Key Test ===');
    console.log('Encrypted key:', API_CONFIG.encryptedKey);
    console.log('Decrypted key:', apiKey);
    console.log('Key length:', apiKey ? apiKey.length : 0);
    console.log('===================');
}

// Проверка авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
        loadUserData();
    } else {
        showAuth();
    }
}

// Показать экран авторизации
function showAuth() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

// Показать основное приложение
function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // Обновить аватар пользователя
    const userAvatar = document.getElementById('userAvatar');
    if (currentUser) {
        userAvatar.innerHTML = currentUser.email.charAt(0).toUpperCase();
        userAvatar.title = currentUser.email;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Авторизация
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    
    // Навигация
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Форма генерации меню
    document.getElementById('menuForm').addEventListener('submit', generateMenu);
    
    // Выход
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Показать форму регистрации
function showRegisterForm() {
    const authCard = document.querySelector('.auth-card');
    authCard.innerHTML = `
        <div class="logo">
            <i class="fas fa-utensils"></i>
        </div>
        <h1 class="app-title">Flash Menu</h1>
        <p class="app-subtitle">Создание аккаунта</p>
        
        <form id="registerForm" class="auth-form">
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
                <input type="password" class="form-input" id="confirmPassword" required minlength="6">
            </div>
            <button type="submit" class="btn btn-primary btn-large">
                <i class="fas fa-user-plus"></i>
                Зарегистрироваться
            </button>
        </form>
        
        <div class="auth-switch">
            Уже есть аккаунт? <a href="#" id="showLogin">Войти</a>
        </div>
    `;
    
    // Добавить обработчик для регистрации
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
}

// Показать форму входа
function showLoginForm() {
    const authCard = document.querySelector('.auth-card');
    authCard.innerHTML = `
        <div class="logo">
            <i class="fas fa-utensils"></i>
        </div>
        <h1 class="app-title">Flash Menu</h1>
        <p class="app-subtitle">Умный планировщик покупок и меню</p>
        
        <form id="loginForm" class="auth-form">
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="loginEmail" required>
            </div>
            <div class="form-group">
                <label class="form-label">Пароль</label>
                <input type="password" class="form-input" id="loginPassword" required>
            </div>
            <button type="submit" class="btn btn-primary btn-large">
                <i class="fas fa-sign-in-alt"></i>
                Войти
            </button>
        </form>
        
        <div class="auth-switch">
            Нет аккаунта? <a href="#" id="showRegister">Зарегистрироваться</a>
        </div>
    `;
    
    // Добавить обработчики
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
}

// Обработка регистрации
function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showMessage('Пароли не совпадают', 'error');
        return;
    }
    
    // Проверить, существует ли пользователь
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(user => user.email === email)) {
        showMessage('Пользователь с таким email уже существует', 'error');
        return;
    }
    
    // Создать нового пользователя
    const newUser = {
        id: Date.now(),
        email,
        password: btoa(password), // Простое шифрование для демо
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showMessage('Аккаунт успешно создан! Теперь войдите в систему', 'success');
    setTimeout(() => showLoginForm(), 2000);
}

// Обработка входа
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === btoa(password));
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showApp();
        loadUserData();
        showMessage(`Добро пожаловать, ${user.email}!`, 'success');
    } else {
        showMessage('Неверный email или пароль', 'error');
    }
}

// Выход из системы
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
    showMessage('Вы вышли из системы', 'info');
}

// Загрузка данных пользователя
function loadUserData() {
    if (!currentUser) return;
    
    const userKey = `user_${currentUser.id}`;
    boughtProducts = JSON.parse(localStorage.getItem(`${userKey}_boughtProducts`) || '[]');
    availableIngredients = JSON.parse(localStorage.getItem(`${userKey}_availableIngredients`) || [
        "рис (~700 г)", "макароны", "капуста", "масло", "соль", "специи"
    ]);
    menus = JSON.parse(localStorage.getItem(`${userKey}_menus`) || '[]');
    currentProducts = JSON.parse(localStorage.getItem(`${userKey}_currentProducts`) || '[]');
    
    updateUI();
}

// Сохранение данных пользователя
function saveUserData() {
    if (!currentUser) return;
    
    const userKey = `user_${currentUser.id}`;
    localStorage.setItem(`${userKey}_boughtProducts`, JSON.stringify(boughtProducts));
    localStorage.setItem(`${userKey}_availableIngredients`, JSON.stringify(availableIngredients));
    localStorage.setItem(`${userKey}_menus`, JSON.stringify(menus));
    localStorage.setItem(`${userKey}_currentProducts`, JSON.stringify(currentProducts));
}

// Переключение вкладок
function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'shopping') {
        updateShoppingUI();
    } else if (tabName === 'menu') {
        updateMenuUI();
    }
}

// Генерация меню через Gemini API
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
    showMessage('Генерация меню...', 'success');

    try {
        // Генерация меню
        const menuPrompt = `Составь меню на ${days} дней для ${meal} с бюджетом ${budget} ₽, используя продукты из каталога Макси. Учитывай имеющиеся продукты: ${availableIngredients.join(', ')}. Формат: JSON с полями day, meal, recipe, ingredients [{ name, qty, unit }], cookingTime. Верни только JSON в кодовых блоках.`;
        
        const menuResponse = await callGeminiAPI(menuPrompt);
        const menuData = parseJSONResponse(menuResponse);
        
        if (!menuData || !Array.isArray(menuData)) {
            throw new Error('Неверный формат ответа API');
        }

        // Получение цен для продуктов
        const productsWithPrices = await getProductsWithPrices(menuData, budget);
        
        if (productsWithPrices.totalCost > budget) {
            // Попытка корректировки меню
            const adjustedMenu = await adjustMenuForBudget(menuData, budget, productsWithPrices.totalCost);
            if (adjustedMenu) {
                menuData = adjustedMenu;
                productsWithPrices = await getProductsWithPrices(menuData, budget);
            }
        }

        // Сохранение меню
        const menuId = Date.now();
        const newMenu = {
            id: menuId,
            budget,
            days,
            meal,
            start,
            items: menuData,
            totalCost: productsWithPrices.totalCost,
            createdAt: new Date().toISOString()
        };

        menus.push(newMenu);
        currentMenu = newMenu;
        currentProducts = productsWithPrices.products;

        saveUserData();
        updateMenuSelector();
        showMessage('Меню успешно сгенерировано!', 'success');
        
        // Переключение на вкладку покупок
        setTimeout(() => switchTab('shopping'), 1000);

    } catch (error) {
        console.error('Ошибка генерации меню:', error);
        showMessage(`Ошибка: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Вызов Gemini API
async function callGeminiAPI(prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Не удалось получить API ключ');
    }

    // Формируем URL с API ключом
    const url = `${API_CONFIG.baseUrl}?key=${apiKey}`;
    
    console.log('API URL:', url);
    console.log('API Key:', apiKey ? 'Получен' : 'Не получен');

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
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Ошибка API: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Парсинг JSON ответа
function parseJSONResponse(response) {
    try {
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(response);
    } catch (error) {
        throw new Error('Не удалось распарсить ответ API');
    }
}

// Получение цен для продуктов
async function getProductsWithPrices(menuData, budget) {
    const allIngredients = new Map();
    const products = [];
    let totalCost = 0;

    // Сбор всех ингредиентов
    menuData.forEach(item => {
        if (item.ingredients) {
            item.ingredients.forEach(ingredient => {
                const key = ingredient.name.toLowerCase();
                if (!allIngredients.has(key)) {
                    allIngredients.set(key, ingredient);
                }
            });
        }
    });

    // Получение цен по одному продукту
    for (const [key, ingredient] of allIngredients) {
        try {
            const pricePrompt = `Найди цену для продукта "${ingredient.name}" в каталоге Макси. Формат ответа: JSON с полями name, pack, price. Если продукт не найден, предложи аналог. Верни только JSON.`;
            
            const priceResponse = await callGeminiAPI(pricePrompt);
            const priceData = parseJSONResponse(priceResponse);
            
            if (priceData && priceData.price) {
                const product = {
                    name: priceData.name,
                    pack: priceData.pack,
                    price: parseFloat(priceData.price),
                    qty: ingredient.qty || 1,
                    unit: ingredient.unit || 'шт',
                    sum: parseFloat(priceData.price) * (ingredient.qty || 1)
                };
                
                products.push(product);
                totalCost += product.sum;
            }
        } catch (error) {
            console.warn(`Ошибка получения цены для ${ingredient.name}:`, error);
            // Добавляем продукт с примерной ценой
            const product = {
                name: ingredient.name,
                pack: '~',
                price: 100,
                qty: ingredient.qty || 1,
                unit: ingredient.unit || 'шт',
                sum: 100 * (ingredient.qty || 1)
            };
            products.push(product);
            totalCost += product.sum;
        }
    }

    return { products, totalCost };
}

// Корректировка меню под бюджет
async function adjustMenuForBudget(originalMenu, budget, currentCost) {
    try {
        const adjustPrompt = `Скорректируй меню, чтобы уложиться в бюджет ${budget} ₽. Текущая стоимость: ${currentCost} ₽. Используй более дешёвые продукты, замени дорогие ингредиенты на аналоги. Формат: JSON с полями day, meal, recipe, ingredients [{ name, qty, unit }], cookingTime. Верни только JSON.`;
        
        const adjustResponse = await callGeminiAPI(adjustPrompt);
        return parseJSONResponse(adjustResponse);
    } catch (error) {
        console.warn('Не удалось скорректировать меню:', error);
        return null;
    }
}

// Обновление UI покупок
function updateShoppingUI() {
    const shoppingContent = document.getElementById('shoppingContent');
    
    if (currentProducts.length === 0) {
        shoppingContent.innerHTML = '<p>Сначала сгенерируйте меню</p>';
        return;
    }

    shoppingContent.innerHTML = `
        <div class="available-ingredients">
            <div class="ingredients-title">Имеющиеся ингредиенты:</div>
            <div class="ingredients-list">${availableIngredients.join(', ')}</div>
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
    `;

    // Добавить обработчики для новых элементов
    document.getElementById('searchProducts').addEventListener('input', filterProducts);
    document.getElementById('markAllBought').addEventListener('click', markAllAsBought);
    document.getElementById('resetList').addEventListener('click', resetShoppingList);

    renderProductsList();
}

// Рендеринг списка продуктов
function renderProductsList() {
    const productsList = document.getElementById('productsList');
    const boughtProductsDiv = document.getElementById('boughtProducts');
    const totalSum = document.getElementById('totalSum');
    const progressFill = document.getElementById('progressFill');

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
            });
            
            productsList.appendChild(productCard);
        }
    });

    // Купленные продукты
    boughtProductsDiv.innerHTML = '';
    boughtProducts.forEach(index => {
        const product = currentProducts[index];
        if (product) {
            const boughtCard = document.createElement('div');
            boughtCard.className = 'product-card';
            boughtCard.style.background = '#ecfdf5';
            boughtCard.innerHTML = `
                <div class="product-info">
                    <div class="product-name">${product.name} ✓</div>
                    <div class="product-details">${product.pack} • ${product.qty} ${product.unit}</div>
                </div>
                <div class="product-price">${product.sum.toFixed(2)} ₽</div>
            `;
            boughtProductsDiv.appendChild(boughtCard);
        }
    });

    // Общая сумма и прогресс
    const totalCost = currentProducts.reduce((sum, product, index) => {
        return sum + (boughtProducts.includes(index) ? 0 : product.sum);
    }, 0);

    totalSum.textContent = `Общая сумма: ${totalCost.toFixed(2)} ₽`;
    
    const progress = currentProducts.length > 0 ? (boughtProducts.length / currentProducts.length) * 100 : 0;
    progressFill.style.width = `${progress}%`;
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
    
    if (menus.length === 0) {
        menuContent.innerHTML = '<p>Сначала сгенерируйте меню</p>';
        return;
    }

    menuContent.innerHTML = `
        <div class="menu-selector">
            <select class="menu-select" id="menuSelector">
                <option value="">Выберите меню...</option>
            </select>
            <button class="btn btn-success" id="generateNewMenu">Сгенерировать новое меню</button>
        </div>
        
        <div id="menuItems"></div>
    `;

    // Добавить обработчики
    document.getElementById('generateNewMenu').addEventListener('click', () => switchTab('settings'));
    document.getElementById('menuSelector').addEventListener('change', loadSelectedMenu);

    updateMenuSelector();
    renderMenuItems();
}

// Обновление селектора меню
function updateMenuSelector() {
    const selector = document.getElementById('menuSelector');
    if (!selector) return;
    
    selector.innerHTML = '<option value="">Выберите меню...</option>';
    
    menus.forEach(menu => {
        const option = document.createElement('option');
        option.value = menu.id;
        option.textContent = `Меню на ${menu.days} дней (${menu.meal}, ${menu.budget} ₽)`;
        selector.appendChild(option);
    });
}

// Загрузка выбранного меню
function loadSelectedMenu() {
    const menuId = document.getElementById('menuSelector').value;
    if (menuId) {
        currentMenu = menus.find(m => m.id == menuId);
        renderMenuItems();
    }
}

// Рендеринг элементов меню
function renderMenuItems() {
    const menuItems = document.getElementById('menuItems');
    
    if (!currentMenu) {
        menuItems.innerHTML = '<p>Выберите меню из списка</p>';
        return;
    }

    menuItems.innerHTML = '';
    currentMenu.items.forEach((item, index) => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        
        const ingredientsList = item.ingredients ? item.ingredients.map(ing => 
            `${ing.name} ${ing.qty} ${ing.unit}`
        ).join(', ') : '';

        recipeCard.innerHTML = `
            <div class="recipe-header">
                <div class="recipe-title">${item.day} - ${item.meal}</div>
                ${item.cookingTime ? `<div class="recipe-time">${item.cookingTime} мин</div>` : ''}
            </div>
            <div class="recipe-ingredients">
                <strong>Ингредиенты:</strong> ${ingredientsList}
            </div>
            <p>${item.recipe}</p>
            ${item.cookingTime ? `<button class="btn btn-primary" onclick="startTimer(${item.cookingTime})">Запустить таймер</button>` : ''}
        `;
        
        menuItems.appendChild(recipeCard);
    });
}

// Запуск таймера
function startTimer(minutes) {
    if (activeTimer) {
        clearInterval(activeTimer);
    }

    let timeLeft = minutes * 60;
    const timerDisplay = document.getElementById('timerDisplay');
    const timer = document.getElementById('timer');

    if (!timer) {
        // Создать таймер если его нет
        const timerHTML = `
            <div class="timer active" id="timer">
                <div class="timer-display" id="timerDisplay">${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}</div>
                <button class="btn btn-primary" id="stopTimer">Остановить таймер</button>
            </div>
        `;
        document.querySelector('.container').insertAdjacentHTML('beforeend', timerHTML);
        
        document.getElementById('stopTimer').addEventListener('click', stopTimer);
    } else {
        timer.classList.add('active');
    }

    activeTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('timerDisplay').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(activeTimer);
            activeTimer = null;
            document.getElementById('timer').classList.remove('active');
            
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

// Показать/скрыть загрузку
function showLoading(show) {
    document.getElementById('loading').classList.toggle('active', show);
}

// Показать сообщение
function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${text}
    `;
    
    document.querySelector('.container').insertBefore(message, document.querySelector('nav').nextSibling);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Обновление всего UI
function updateUI() {
    updateShoppingUI();
    updateMenuUI();
}

// Запрос разрешения на уведомления
if ('Notification' in window) {
    Notification.requestPermission();
} 