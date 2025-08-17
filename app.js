// Конфигурация API (используем из config.js)
const API_CONFIG = window.GEMINI_CONFIG || {
    apiKey: 'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

// Проверяем правильность API ключа
console.log('=== API Key Verification ===');
console.log('Config loaded:', !!window.GEMINI_CONFIG);
console.log('API Key from config:', API_CONFIG.apiKey);
console.log('API Key length:', API_CONFIG.apiKey ? API_CONFIG.apiKey.length : 0);
console.log('Expected key:', 'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4');
console.log('Keys match:', API_CONFIG.apiKey === 'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4');
console.log('==========================');

// Функция для получения API ключа
function getApiKey() {
    try {
        // Используем API ключ из конфигурации
        if (API_CONFIG.apiKey) {
            console.log('✅ API Key загружен из конфигурации');
            return API_CONFIG.apiKey;
        }
        
        console.error('❌ API ключ не найден в конфигурации');
        return null;
    } catch (error) {
        console.error('❌ Ошибка получения API ключа:', error);
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

// Инициализация Supabase
let supabaseClient = null;

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Flash Menu загружается...');
    console.log('📁 Текущая директория:', window.location.href);
    console.log('🔧 Доступные скрипты:', document.querySelectorAll('script').length);
    console.log('📋 Скрипты:', Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline'));
    
    // Инициализируем Supabase
    console.log('🗄️ Инициализируем Supabase...');
    const supabaseResult = await initSupabase();
    console.log('📊 Результат инициализации Supabase:', supabaseResult);
    
    // Тестируем API ключ
    testApiKey();
    
    // Очищаем поврежденные данные (если не используем Supabase)
    if (!supabaseClient) {
        console.log('🧹 Очищаем поврежденные данные localStorage...');
        clearCorruptedData();
    }
    
    console.log('🔐 Проверяем авторизацию...');
    await checkAuth();
    
    console.log('⚙️ Настраиваем обработчики событий...');
    setupEventListeners();
    
    console.log('✅ Flash Menu загружен');
    console.log('🎯 Готов к работе!');
});

// Инициализация Supabase
async function initSupabase() {
    console.log('🚀 Начинаем инициализацию Supabase...');
    console.log('SUPABASE_CONFIG:', window.SUPABASE_CONFIG);
    
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.anonKey) {
        try {
            console.log('🔧 Создаем SupabaseClient...');
            console.log('SupabaseClient доступен:', typeof SupabaseClient);
            console.log('SupabaseClient:', SupabaseClient);
            
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
                return true;
            } else {
                console.error('❌ Не удалось подключиться к Supabase');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации Supabase:', error);
        }
    } else {
        console.log('⚠️ SUPABASE_CONFIG не найден или неполный');
        console.log('URL:', window.SUPABASE_CONFIG?.url);
        console.log('Key:', window.SUPABASE_CONFIG?.anonKey ? 'Есть' : 'Нет');
    }
    
    console.log('⚠️ Supabase не настроен, используем localStorage');
    return false;
}

// Тестирование API ключа
function testApiKey() {
    const apiKey = getApiKey();
    console.log('=== API Key Test ===');
    console.log('Config loaded:', !!window.GEMINI_CONFIG);
    console.log('API Key from config:', API_CONFIG.apiKey);
    console.log('Current API key:', apiKey);
    console.log('Key length:', apiKey ? apiKey.length : 0);
    console.log('New key expected:', 'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4');
    console.log('Keys match:', apiKey === 'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4');
    console.log('===================');
}

// Проверка авторизации
async function checkAuth() {
    if (supabaseClient) {
        try {
            // Проверяем текущего пользователя в Supabase
            const user = await supabaseClient.getCurrentUser();
            if (user) {
                currentUser = user;
                showApp();
                await loadUserData();
                return;
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации Supabase:', error);
        }
    }
    
    // Fallback на localStorage
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
    console.log('⚙️ Настраиваем обработчики событий...');
    
    // Авторизация - добавляем обработчики для элементов, которые уже есть в HTML
    const loginForm = document.getElementById('loginForm');
    const showRegister = document.getElementById('showRegister');
    const showForgotPassword = document.getElementById('showForgotPassword');
    
    if (loginForm) {
        console.log('✅ Добавляем обработчик для loginForm');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.log('❌ loginForm не найден');
    }
    
    if (showRegister) {
        console.log('✅ Добавляем обработчик для showRegister');
        showRegister.addEventListener('click', showRegisterForm);
    } else {
        console.log('❌ showRegister не найден');
    }
    
    if (showForgotPassword) {
        console.log('✅ Добавляем обработчик для showForgotPassword');
        showForgotPassword.addEventListener('click', showForgotPasswordForm);
    } else {
        console.log('❌ showForgotPassword не найден');
    }
    
    // Навигация
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Форма генерации меню
    const menuForm = document.getElementById('menuForm');
    if (menuForm) {
        menuForm.addEventListener('submit', generateMenu);
    }
    
    // Выход
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    console.log('✅ Обработчики событий настроены');
}

// Показать форму регистрации
function showRegisterForm() {
    console.log('🔐 Показываем форму регистрации...');
    const authCard = document.querySelector('.auth-card');
    console.log('authCard:', authCard);
    
    if (!authCard) {
        console.error('❌ authCard не найден!');
        return;
    }
    
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
    console.log('🔑 Показываем форму входа...');
    const authCard = document.querySelector('.auth-card');
    console.log('authCard:', authCard);
    
    if (!authCard) {
        console.error('❌ authCard не найден!');
        return;
    }
    
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
            <br>
            <a href="#" id="showForgotPassword">Забыли пароль?</a>
        </div>
    `;
    
    // Добавить обработчики
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    document.getElementById('showForgotPassword').addEventListener('click', showForgotPasswordForm);
}

// Показать форму восстановления пароля
function showForgotPasswordForm() {
    console.log('📧 Показываем форму восстановления пароля...');
    const authCard = document.querySelector('.auth-card');
    console.log('authCard:', authCard);
    
    if (!authCard) {
        console.error('❌ authCard не найден!');
        return;
    }
    
    authCard.innerHTML = `
        <div class="logo">
            <i class="fas fa-utensils"></i>
        </div>
        <h1 class="app-title">Flash Menu</h1>
        <p class="app-subtitle">Восстановление пароля</p>
        
        <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="forgotPasswordEmail" required>
        </div>
        <button type="button" class="btn btn-primary btn-large" id="resetPasswordBtn">
            <i class="fas fa-envelope"></i>
            Отправить инструкции
        </button>
        
        <div class="auth-switch">
            <a href="#" id="backToLogin">Вернуться к входу</a>
        </div>
    `;
    
    // Добавить обработчики
    document.getElementById('resetPasswordBtn').addEventListener('click', handleResetPassword);
    document.getElementById('backToLogin').addEventListener('click', showLoginForm);
}

// Обработка восстановления пароля
async function handleResetPassword() {
    const email = document.getElementById('forgotPasswordEmail').value;
    
    if (!email || !email.includes('@')) {
        showMessage('Введите корректный email', 'error');
        return;
    }
    
    try {
        if (supabaseClient) {
            // Восстановление пароля через Supabase
            const { error } = await supabaseClient.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            });
            
            if (error) throw error;
            
            showMessage('Инструкции по восстановлению пароля отправлены на ваш email', 'success');
            setTimeout(() => showLoginForm(), 2000);
        } else {
            showMessage('Восстановление пароля недоступно в режиме localStorage', 'error');
        }
    } catch (error) {
        console.error('Ошибка восстановления пароля:', error);
        showMessage(`Ошибка: ${error.message}`, 'error');
    }
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();
    
    console.log('🔐 Начинаем регистрацию...');
    console.log('supabaseClient:', supabaseClient);
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    console.log('📧 Email:', email);
    console.log('🔑 Пароль:', password ? '***' : 'пустой');
    console.log('🔑 Подтверждение:', confirmPassword ? '***' : 'пустой');
    
    if (password !== confirmPassword) {
        showMessage('Пароли не совпадают', 'error');
        return;
    }
    
    try {
        if (supabaseClient && supabaseClient.initialized) {
            console.log('🚀 Регистрация через Supabase...');
            // Регистрация через Supabase
            const user = await supabaseClient.registerUser(email, password);
            console.log('✅ Пользователь создан:', user);
            currentUser = user;
            showApp();
            await loadUserData();
            showMessage('Аккаунт успешно создан!', 'success');
        } else {
            console.log('💾 Fallback на localStorage...');
            // Fallback на localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.find(user => user.email === email)) {
                showMessage('Пользователь с таким email уже существует', 'error');
                return;
            }
            
            const newUser = {
                id: Date.now(),
                email,
                password: btoa(password),
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            showMessage('Аккаунт успешно создан! Теперь войдите в систему', 'success');
            setTimeout(() => showLoginForm(), 2000);
        }
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        showMessage(`Ошибка регистрации: ${error.message}`, 'error');
    }
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        if (supabaseClient) {
            // Вход через Supabase
            const user = await supabaseClient.loginUser(email, password);
            currentUser = user;
            showApp();
            await loadUserData();
            showMessage(`Добро пожаловать, ${user.email}!`, 'success');
        } else {
            // Fallback на localStorage
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
    } catch (error) {
        console.error('Ошибка входа:', error);
        showMessage(`Ошибка входа: ${error.message}`, 'error');
    }
}

// Выход из системы
async function logout() {
    try {
        if (supabaseClient) {
            await supabaseClient.logoutUser();
        }
    } catch (error) {
        console.error('Ошибка выхода из Supabase:', error);
    }
    
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuth();
    showMessage('Вы вышли из системы', 'info');
}

// Загрузка данных пользователя
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        if (supabaseClient) {
            // Загрузка данных из Supabase
            const userData = await supabaseClient.loadUserData(currentUser.id);
            if (userData) {
                availableIngredients = userData.availableIngredients || [
                    "рис (~700 г)", "макароны", "капуста", "масло", "соль", "специи"
                ];
                menus = userData.menus || [];
                currentProducts = userData.currentProducts || [];
                boughtProducts = userData.boughtProducts || [];
            }
        } else {
            // Fallback на localStorage
            const userKey = `user_${currentUser.id}`;
            
            try {
                boughtProducts = safeJsonParse(localStorage.getItem(`${userKey}_boughtProducts`), []);
                availableIngredients = safeJsonParse(localStorage.getItem(`${userKey}_availableIngredients`), [
                    "рис (~700 г)", "макароны", "капуста", "масло", "соль", "специи"
                ]);
                menus = safeJsonParse(localStorage.getItem(`${userKey}_menus`), []);
                currentProducts = safeJsonParse(localStorage.getItem(`${userKey}_currentProducts`), []);
            } catch (error) {
                console.error('Ошибка загрузки данных пользователя:', error);
                resetUserData(userKey);
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
    
    updateUI();
}

// Безопасный парсинг JSON
function safeJsonParse(jsonString, defaultValue) {
    if (!jsonString) return defaultValue;
    
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('Ошибка парсинга JSON, используем значение по умолчанию:', error);
        return defaultValue;
    }
}

// Сброс данных пользователя к начальным значениям
function resetUserData(userKey) {
    console.log('Сброс данных пользователя к начальным значениям');
    
    boughtProducts = [];
    availableIngredients = [
        "рис (~700 г)", "макароны", "капуста", "масло", "соль", "специи"
    ];
    menus = [];
    currentProducts = [];
    
    // Сохраняем очищенные данные
    saveUserData();
}

// Очистка поврежденных данных в localStorage
function clearCorruptedData() {
    console.log('Очистка поврежденных данных в localStorage');
    
    // Получаем все ключи localStorage
    const keys = Object.keys(localStorage);
    
    // Ищем ключи, связанные с пользователями
    const userKeys = keys.filter(key => key.startsWith('user_'));
    
    userKeys.forEach(key => {
        try {
            // Пытаемся распарсить данные
            const data = localStorage.getItem(key);
            if (data) {
                JSON.parse(data);
            }
        } catch (error) {
            console.warn(`Поврежденные данные в ключе ${key}, удаляем`);
            localStorage.removeItem(key);
        }
    });
    
    console.log('Очистка завершена');
}

// Очистка всех данных пользователя
function clearAllUserData() {
    if (!currentUser) return;
    
    if (confirm('Вы уверены, что хотите очистить ВСЕ данные? Это действие нельзя отменить!')) {
        console.log('Очистка всех данных пользователя');
        
        const userKey = `user_${currentUser.id}`;
        
        // Удаляем все данные пользователя
        localStorage.removeItem(`${userKey}_boughtProducts`);
        localStorage.removeItem(`${userKey}_availableIngredients`);
        localStorage.removeItem(`${userKey}_menus`);
        localStorage.removeItem(`${userKey}_currentProducts`);
        
        // Сбрасываем переменные
        boughtProducts = [];
        availableIngredients = [
            "рис (~700 г)", "макароны", "капуста", "масло", "соль", "специи"
        ];
        menus = [];
        currentProducts = [];
        
        // Обновляем UI
        updateShoppingUI();
        updateMenuUI();
        
        showMessage('Все данные пользователя очищены', 'success');
    }
}

// Сохранение данных пользователя
async function saveUserData() {
    if (!currentUser) return;
    
    try {
        if (supabaseClient) {
            // Сохраняем в Supabase
            await supabaseClient.updateUserData(currentUser.id, {
                available_ingredients: availableIngredients,
                menus: menus
            });
            
            // Сохраняем продукты
            await supabaseClient.saveProducts(currentUser.id, currentProducts);
            
            console.log('✅ Данные сохранены в Supabase');
        } else {
            // Fallback на localStorage
            const userKey = `user_${currentUser.id}`;
            localStorage.setItem(`${userKey}_boughtProducts`, JSON.stringify(boughtProducts));
            localStorage.setItem(`${userKey}_availableIngredients`, JSON.stringify(availableIngredients));
            localStorage.setItem(`${userKey}_menus`, JSON.stringify(menus));
            localStorage.setItem(`${userKey}_currentProducts`, JSON.stringify(currentProducts));
        }
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        showMessage('Ошибка сохранения данных', 'error');
    }
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
    
    console.log('🔑 API Key получен:', apiKey.substring(0, 10) + '...');
    console.log('🌐 API URL:', url);

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
        <button class="btn btn-warning" id="clearAllData">Очистить все данные</button>
    `;

    // Добавить обработчики для новых элементов
    document.getElementById('searchProducts').addEventListener('input', filterProducts);
    document.getElementById('markAllBought').addEventListener('click', markAllAsBought);
    document.getElementById('resetList').addEventListener('click', resetShoppingList);
    document.getElementById('clearAllData').addEventListener('click', clearAllUserData);

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