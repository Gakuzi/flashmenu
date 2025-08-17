// Flash Menu - Упрощенная версия без сервера
// Работает полностью в браузере с Mock API

// Глобальные переменные
let currentUser = null;
let menus = [];
let currentMenu = null;
let currentProducts = [];
let availableIngredients = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Flash Menu запущен');
    loadUserData();
    setupEventListeners();
    checkAuth();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Формы авторизации
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    document.getElementById('showForgotPassword').addEventListener('click', showForgotPasswordForm);
    document.getElementById('backToLogin').addEventListener('click', showLoginForm);
    document.getElementById('resetPasswordBtn').addEventListener('click', handleForgotPassword);
    
    // Основное приложение
    document.getElementById('menuForm').addEventListener('submit', generateMenu);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Навигация
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

// Показать форму регистрации
function showRegisterForm(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    
    const registerForm = document.createElement('form');
    registerForm.id = 'registerForm';
    registerForm.className = 'auth-form';
    registerForm.innerHTML = `
        <h3>Регистрация</h3>
        <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="registerEmail" required>
        </div>
        <div class="form-group">
            <label class="form-label">Пароль</label>
            <input type="password" class="form-input" id="registerPassword" required>
        </div>
        <button type="submit" class="btn btn-primary btn-large">
            <i class="fas fa-user-plus"></i>
            Зарегистрироваться
        </button>
        <div class="auth-switch">
            <a href="#" id="backToLoginFromRegister">Вернуться к входу</a>
        </div>
    `;
    
    document.querySelector('.auth-card').appendChild(registerForm);
    
    // Обработчик регистрации
    registerForm.addEventListener('submit', handleRegister);
    document.getElementById('backToLoginFromRegister').addEventListener('click', showLoginForm);
}

// Показать форму входа
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.remove();
}

// Показать форму восстановления пароля
function showForgotPasswordForm(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.remove();
}

// Обработка входа
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Заполните все поля', 'error');
        return;
    }
    
    // Простая проверка (в реальном приложении здесь должна быть проверка с базой данных)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        showApp();
        showMessage('Вход выполнен успешно!', 'success');
    } else {
        showMessage('Неверный email или пароль', 'error');
    }
}

// Обработка регистрации
function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!email || !password) {
        showMessage('Заполните все поля', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showMessage('Пользователь с таким email уже существует', 'error');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        email,
        password,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    showApp();
    showMessage('Регистрация выполнена успешно!', 'success');
}

// Обработка восстановления пароля
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotPasswordEmail').value;
    
    if (!email) {
        showMessage('Введите email', 'error');
        return;
    }
    
    // В реальном приложении здесь должна быть отправка email
    showMessage('Инструкции по восстановлению пароля отправлены на ваш email', 'success');
    showLoginForm();
}

// Проверка авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
    }
}

// Показать основное приложение
function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // Сохранить текущего пользователя
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Обновить аватар
    document.getElementById('userAvatar').innerHTML = currentUser.email.charAt(0).toUpperCase();
    
    // Загрузить данные пользователя
    loadUserData();
}

// Обработка выхода
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    
    // Очистить формы
    document.getElementById('loginForm').reset();
    showLoginForm();
    
    showMessage('Выход выполнен успешно', 'success');
}

// Загрузка данных пользователя
function loadUserData() {
    if (!currentUser) return;
    
    const userKey = `user_${currentUser.id}`;
    const userData = JSON.parse(localStorage.getItem(userKey) || '{}');
    
    menus = userData.menus || [];
    currentMenu = userData.currentMenu || null;
    currentProducts = userData.currentProducts || [];
    availableIngredients = userData.availableIngredients || [];
    
    updateMenuSelector();
    renderMenuItems();
    renderShoppingList();
}

// Сохранение данных пользователя
function saveUserData() {
    if (!currentUser) return;
    
    const userKey = `user_${currentUser.id}`;
    const userData = {
        menus,
        currentMenu,
        currentProducts,
        availableIngredients
    };
    
    localStorage.setItem(userKey, JSON.stringify(userData));
}

// Mock API для генерации меню
function generateMockMenu(days, meal) {
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

    let menuItems = [];
    
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
    
    return menuItems;
}

// Mock API для получения цен
function getMockPrices(ingredients) {
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

    let totalCost = 0;
    let products = [];

    // Собираем все ингредиенты
    let allIngredients = [];
    ingredients.forEach(item => {
        item.ingredients.forEach(ingredient => {
            allIngredients.push({
                name: ingredient.name.toLowerCase(),
                qty: ingredient.qty,
                unit: ingredient.unit
            });
        });
    });

    // Группируем одинаковые ингредиенты
    const groupedIngredients = {};
    allIngredients.forEach(ingredient => {
        const key = ingredient.name;
        if (groupedIngredients[key]) {
            groupedIngredients[key].qty += ingredient.qty;
        } else {
            groupedIngredients[key] = { ...ingredient };
        }
    });

    // Получаем цены для каждого ингредиента
    Object.values(groupedIngredients).forEach(ingredient => {
        let foundProduct = null;
        
        // Ищем продукт по названию (регистронезависимо)
        for (const [key, product] of Object.entries(realisticPrices)) {
            if (ingredient.name.includes(key) || key.includes(ingredient.name)) {
                foundProduct = product;
                break;
            }
        }

        if (foundProduct) {
            // Рассчитываем стоимость для нужного количества
            const packQty = parseFloat(foundProduct.pack.replace(/[^\d.]/g, ''));
            const packsNeeded = Math.ceil(ingredient.qty / packQty);
            const cost = packsNeeded * foundProduct.price;
            
            totalCost += cost;
            
            products.push({
                name: foundProduct.name,
                pack: foundProduct.pack,
                price: foundProduct.price,
                qty: ingredient.qty,
                unit: ingredient.unit,
                packsNeeded,
                totalCost: cost
            });
        } else {
            // Если продукт не найден, используем примерную цену
            const estimatedCost = 150;
            totalCost += estimatedCost;
            
            products.push({
                name: ingredient.name,
                pack: '~',
                price: 150,
                qty: ingredient.qty,
                unit: ingredient.unit,
                packsNeeded: 1,
                totalCost: estimatedCost
            });
        }
    });

    return { products, totalCost };
}

// Генерация меню
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
        console.log('🚀 Начинаем генерацию меню...');
        console.log('💰 Бюджет:', budget, '₽');
        console.log('📅 Дни:', days);
        console.log('🍽️ Прием пищи:', meal);
        console.log('📍 Начало:', start);
        
        // Генерация меню через Mock API
        const menuData = generateMockMenu(days, meal);
        
        console.log('📋 Получены данные меню:', menuData);
        
        if (!menuData || !Array.isArray(menuData)) {
            throw new Error('Неверный формат данных меню');
        }

        // Получение цен для продуктов
        console.log('💰 Получаем цены для продуктов...');
        const productsWithPrices = getMockPrices(menuData);
        
        console.log('💵 Стоимость продуктов:', productsWithPrices.totalCost, '₽');
        
        if (productsWithPrices.totalCost > budget) {
            console.log('⚠️ Превышение бюджета, корректируем меню...');
            // Упрощенная корректировка - уменьшаем количество дней
            const adjustedDays = Math.floor(budget / (productsWithPrices.totalCost / days));
            if (adjustedDays >= 1) {
                const adjustedMenu = generateMockMenu(adjustedDays, meal);
                const adjustedPrices = getMockPrices(adjustedMenu);
                console.log('✅ Меню скорректировано на', adjustedDays, 'дней');
                menuData.splice(0, menuData.length, ...adjustedMenu);
                Object.assign(productsWithPrices, adjustedPrices);
            }
        }

        // Сохранение меню
        console.log('💾 Сохраняем сгенерированное меню...');
        
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
        
        console.log('📋 Новое меню:', newMenu);
        
        menus.push(newMenu);
        currentMenu = newMenu;
        currentProducts = productsWithPrices.products;
        
        console.log('📊 Обновляем данные приложения...');
        console.log('🍽️ Меню:', menus.length, 'шт');
        console.log('🛒 Продукты:', currentProducts.length, 'шт');

        saveUserData();
        updateMenuSelector();
        showMessage('Меню успешно сгенерировано!', 'success');
        
        console.log('✅ Меню успешно сгенерировано и сохранено');
        
        // Переключение на вкладку покупок
        setTimeout(() => switchTab('shopping'), 1000);

    } catch (error) {
        console.error('Ошибка генерации меню:', error);
        showMessage(`Ошибка: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Обновление селектора меню
function updateMenuSelector() {
    const menuSelect = document.getElementById('menuSelect');
    if (!menuSelect) return;
    
    menuSelect.innerHTML = '<option value="">Выберите меню</option>';
    
    menus.forEach(menu => {
        const option = document.createElement('option');
        option.value = menu.id;
        option.textContent = `Меню на ${menu.days} дней (${menu.meal}) - ${menu.totalCost.toFixed(2)} ₽ - ${new Date(menu.createdAt).toLocaleDateString()}`;
        menuSelect.appendChild(option);
    });
}

// Рендеринг элементов меню
function renderMenuItems() {
    const menuContent = document.getElementById('menuContent');
    if (!menuContent) return;
    
    if (!currentMenu) {
        menuContent.innerHTML = '<p>Сначала сгенерируйте меню</p>';
        return;
    }
    
    let html = '<div class="menu-info">';
    html += `<h3>Меню на ${currentMenu.days} дней</h3>`;
    html += `<p><strong>Бюджет:</strong> ${currentMenu.budget} ₽</p>`;
    html += `<p><strong>Стоимость:</strong> ${currentMenu.totalCost.toFixed(2)} ₽</p>`;
    html += `<p><strong>Создано:</strong> ${new Date(currentMenu.createdAt).toLocaleDateString()}</p>`;
    html += '</div>';
    
    // Группируем блюда по дням
    const groupedByDay = {};
    currentMenu.items.forEach(item => {
        if (!groupedByDay[item.day]) {
            groupedByDay[item.day] = [];
        }
        groupedByDay[item.day].push(item);
    });
    
    Object.entries(groupedByDay).forEach(([day, items]) => {
        html += `<div class="day-group">`;
        html += `<h4 class="day-header">${day}</h4>`;
        
        items.forEach(item => {
            html += `
                <div class="recipe-card">
                    <div class="recipe-header">
                        <span class="recipe-title">${item.meal}: ${item.recipe}</span>
                        <span class="recipe-time">${item.cookingTime} мин</span>
                    </div>
                    <div class="recipe-ingredients">
                        <strong>Ингредиенты:</strong><br>
                        ${item.ingredients.map(ing => `${ing.name} - ${ing.qty} ${ing.unit}`).join('<br>')}
                    </div>
                    <button class="btn btn-primary" onclick="startTimer(${item.cookingTime}, '${item.recipe}')">
                        <i class="fas fa-clock"></i> Запустить таймер
                    </button>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    menuContent.innerHTML = html;
}

// Рендеринг списка покупок
function renderShoppingList() {
    const shoppingContent = document.getElementById('shoppingContent');
    if (!shoppingContent) return;
    
    if (!currentProducts || currentProducts.length === 0) {
        shoppingContent.innerHTML = '<p>Сначала сгенерируйте меню</p>';
        return;
    }
    
    let html = `
        <div class="search-box">
            <input type="text" class="search-input" id="searchProducts" placeholder="Поиск продуктов...">
        </div>
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
        </div>
        <div class="total-sum" id="totalSum">
            Общая сумма: ${currentProducts.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)} ₽
        </div>
    `;
    
    currentProducts.forEach((product, index) => {
        html += `
            <div class="product-card" data-index="${index}">
                <input type="checkbox" class="checkbox" id="product${index}" onchange="toggleProduct(${index})">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-details">
                        ${product.qty} ${product.unit} | ${product.pack} | ${product.price} ₽
                    </div>
                </div>
                <div class="product-price">${product.totalCost.toFixed(2)} ₽</div>
            </div>
        `;
    });
    
    html += `
        <div class="actions">
            <button class="btn btn-success" onclick="markAllAsBought()">
                <i class="fas fa-check-double"></i> У меня есть все продукты
            </button>
            <button class="btn btn-warning" onclick="clearBoughtProducts()">
                <i class="fas fa-eraser"></i> Очистить отметки
            </button>
        </div>
    `;
    
    shoppingContent.innerHTML = html;
    
    // Поиск продуктов
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    updateProgress();
}

// Переключение вкладок
function switchTab(tabName) {
    // Убираем активный класс со всех вкладок
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Активируем нужную вкладку
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Показать сообщение
function showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${text}
    `;
    
    document.querySelector('.container').insertBefore(messageDiv, document.querySelector('.container').firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Показать загрузку
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.toggle('active', show);
    }
}

// Таймер готовки
function startTimer(minutes, recipeName) {
    const timerDiv = document.createElement('div');
    timerDiv.className = 'timer active';
    timerDiv.innerHTML = `
        <h3>Таймер для: ${recipeName}</h3>
        <div class="timer-display" id="timerDisplay">${minutes}:00</div>
        <button class="btn btn-success" onclick="this.parentElement.remove()">Готово!</button>
    `;
    
    document.querySelector('.container').insertBefore(timerDiv, document.querySelector('.container').firstChild);
    
    let timeLeft = minutes * 60;
    const timerInterval = setInterval(() => {
        timeLeft--;
        const minutesLeft = Math.floor(timeLeft / 60);
        const secondsLeft = timeLeft % 60;
        
        document.getElementById('timerDisplay').textContent = 
            `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Уведомление о готовности
            if (Notification.permission === 'granted') {
                new Notification('Блюдо готово!', {
                    body: `Время приготовления ${recipeName} истекло`,
                    icon: '/favicon.ico'
                });
            } else {
                alert(`Блюдо готово! Время приготовления ${recipeName} истекло`);
            }
        }
    }, 1000);
}

// Переключение продукта (куплен/не куплен)
function toggleProduct(index) {
    const boughtProducts = JSON.parse(localStorage.getItem('boughtProducts') || '[]');
    const productIndex = boughtProducts.indexOf(index);
    
    if (productIndex === -1) {
        boughtProducts.push(index);
    } else {
        boughtProducts.splice(productIndex, 1);
    }
    
    localStorage.setItem('boughtProducts', JSON.stringify(boughtProducts));
    updateProgress();
}

// Обновление прогресса покупок
function updateProgress() {
    const boughtProducts = JSON.parse(localStorage.getItem('boughtProducts') || '[]');
    const totalProducts = currentProducts.length;
    const boughtCount = boughtProducts.length;
    const progress = totalProducts > 0 ? (boughtCount / totalProducts) * 100 : 0;
    
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    
    const totalSum = document.getElementById('totalSum');
    if (totalSum) {
        const remainingCost = currentProducts
            .filter((_, index) => !boughtProducts.includes(index))
            .reduce((sum, p) => sum + p.totalCost, 0);
        
        totalSum.innerHTML = `
            Общая сумма: ${currentProducts.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)} ₽<br>
            Осталось купить: ${remainingCost.toFixed(2)} ₽
        `;
    }
}

// Отметить все продукты как купленные
function markAllAsBought() {
    const boughtProducts = [];
    for (let i = 0; i < currentProducts.length; i++) {
        boughtProducts.push(i);
    }
    localStorage.setItem('boughtProducts', JSON.stringify(boughtProducts));
    updateProgress();
    
    // Обновить чекбоксы
    currentProducts.forEach((_, index) => {
        const checkbox = document.getElementById(`product${index}`);
        if (checkbox) checkbox.checked = true;
    });
}

// Очистить отметки о покупках
function clearBoughtProducts() {
    localStorage.removeItem('boughtProducts');
    updateProgress();
    
    // Снять чекбоксы
    currentProducts.forEach((_, index) => {
        const checkbox = document.getElementById(`product${index}`);
        if (checkbox) checkbox.checked = false;
    });
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

// Запрос разрешения на уведомления
if ('Notification' in window) {
    Notification.requestPermission();
} 