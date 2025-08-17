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
        return generateMockMenu(prompt);
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
                        maxOutputTokens: 8192,
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
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`❌ Ошибка с ключом ${currentKeyIndex + 1}:`, errorData);
                
                // Проверяем тип ошибки
                const errorMessage = errorData.error?.message || '';
                
                if (errorMessage.includes('quota') || 
                    errorMessage.includes('exceeded') ||
                    errorMessage.includes('billing') ||
                    response.status === 429) {
                    
                    console.log(`🔄 Ключ ${currentKeyIndex + 1} превысил лимит, пробуем следующий...`);
                    switchToNextKey();
                    attempt++;
                    continue;
                }
                
                if (errorMessage.includes('location') || response.status === 403) {
                    console.log(`🔄 Ключ ${currentKeyIndex + 1} недоступен в регионе, пробуем следующий...`);
                    switchToNextKey();
                    attempt++;
                    continue;
                }
                
                // Другие ошибки - пробуем следующий ключ
                console.log(`🔄 Ошибка с ключом ${currentKeyIndex + 1}, пробуем следующий...`);
                switchToNextKey();
                attempt++;
                continue;
            }

            const data = await response.json();
            console.log(`✅ Ответ получен от Gemini API с ключом ${currentKeyIndex + 1}`);
            resetKeyIndex(); // Сбрасываем на первый ключ при успехе
            return data.candidates[0].content.parts[0].text;
            
        } catch (error) {
            console.error(`❌ Ошибка сети с ключом ${currentKeyIndex + 1}:`, error.message);
            switchToNextKey();
            attempt++;
        }
    }
    
    // Если все ключи не сработали, используем Mock
    console.log('🔄 Все API ключи не сработали, используем Mock данные');
    resetKeyIndex();
    return generateMockMenu(prompt);
}

// Генерация Mock меню (работает без сервера)
function generateMockMenu(prompt) {
    console.log('🎭 Генерируем Mock меню...');
    
    // Создаем правильный формат для парсинга
    const mockMenuData = [
        {
            day: "Понедельник",
            meal: "Завтрак",
            recipe: "Овсяная каша с фруктами",
            ingredients: [
                { name: "Овсяные хлопья", qty: 100, unit: "г" },
                { name: "Молоко", qty: 200, unit: "мл" },
                { name: "Банан", qty: 1, unit: "шт" },
                { name: "Мед", qty: 1, unit: "ч.л." }
            ],
            cookingTime: 15
        },
        {
            day: "Понедельник",
            meal: "Обед",
            recipe: "Куриный суп с овощами",
            ingredients: [
                { name: "Куриная грудка", qty: 150, unit: "г" },
                { name: "Картофель", qty: 2, unit: "шт" },
                { name: "Морковь", qty: 1, unit: "шт" },
                { name: "Лук", qty: 1, unit: "шт" },
                { name: "Зелень", qty: 1, unit: "пучок" }
            ],
            cookingTime: 45
        },
        {
            day: "Понедельник",
            meal: "Ужин",
            recipe: "Греческий салат",
            ingredients: [
                { name: "Огурцы", qty: 2, unit: "шт" },
                { name: "Помидоры", qty: 2, unit: "шт" },
                { name: "Сыр фета", qty: 50, unit: "г" },
                { name: "Оливки", qty: 10, unit: "шт" },
                { name: "Оливковое масло", qty: 2, unit: "ст.л." }
            ],
            cookingTime: 10
        },
        {
            day: "Вторник",
            meal: "Завтрак",
            recipe: "Творожная запеканка",
            ingredients: [
                { name: "Творог", qty: 200, unit: "г" },
                { name: "Яйца", qty: 2, unit: "шт" },
                { name: "Сахар", qty: 2, unit: "ст.л." },
                { name: "Сметана", qty: 2, unit: "ст.л." }
            ],
            cookingTime: 30
        },
        {
            day: "Вторник",
            meal: "Обед",
            recipe: "Паста с томатным соусом",
            ingredients: [
                { name: "Паста", qty: 100, unit: "г" },
                { name: "Томатная паста", qty: 2, unit: "ст.л." },
                { name: "Чеснок", qty: 2, unit: "зубчика" },
                { name: "Базилик", qty: 1, unit: "пучок" }
            ],
            cookingTime: 20
        },
        {
            day: "Вторник",
            meal: "Ужин",
            recipe: "Рыба на пару с овощами",
            ingredients: [
                { name: "Филе трески", qty: 150, unit: "г" },
                { name: "Брокколи", qty: 100, unit: "г" },
                { name: "Цукини", qty: 1, unit: "шт" },
                { name: "Лимон", qty: 0.5, unit: "шт" }
            ],
            cookingTime: 25
        }
    ];
    
    return JSON.stringify(mockMenuData, null, 2);
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
    
    // Проверяем, есть ли реальная конфигурация Supabase (не заглушки)
    if (window.SUPABASE_CONFIG && 
        window.SUPABASE_CONFIG.url && 
        window.SUPABASE_CONFIG.anonKey &&
        window.SUPABASE_CONFIG.url !== 'https://your-project.supabase.co' &&
        window.SUPABASE_CONFIG.anonKey !== 'your-anon-key-here') {
        
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
        console.log('⚠️ SUPABASE_CONFIG не настроен или содержит заглушки');
        console.log('URL:', window.SUPABASE_CONFIG?.url);
        console.log('Key:', window.SUPABASE_CONFIG?.anonKey ? 'Есть' : 'Нет');
    }
    
    console.log('⚠️ Supabase не настроен, используем localStorage');
    return false;
}

// Тестирование API ключа
function testApiKey() {
    const apiKey = getCurrentApiKey();
    console.log('=== API Key Test ===');
    console.log('Config loaded:', !!window.GEMINI_CONFIG);
    console.log('API Key from config:', API_CONFIG.apiKey);
    console.log('Current API key:', apiKey);
    console.log('Key length:', apiKey ? apiKey.length : 0);
    console.log('New key expected:', '[ВАШ_API_КЛЮЧ]');
console.log('Keys match:', apiKey === '[ВАШ_API_КЛЮЧ]');
    console.log('===================');
}

// Проверка авторизации
async function checkAuth() {
    console.log('🔐 Проверяем авторизацию...');
    console.log('supabaseClient:', supabaseClient);
    
    if (supabaseClient && supabaseClient.initialized) {
        try {
            console.log('🚀 Проверяем пользователя в Supabase...');
            // Проверяем текущего пользователя в Supabase
            const user = await supabaseClient.getCurrentUser();
            if (user) {
                console.log('✅ Пользователь найден в Supabase:', user);
                currentUser = user;
                showApp();
                await loadUserData();
                return;
            }
        } catch (error) {
            console.error('❌ Ошибка проверки авторизации Supabase:', error);
        }
    }
    
    // Fallback на localStorage
    console.log('💾 Проверяем localStorage...');
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('✅ Пользователь найден в localStorage:', currentUser);
            showApp();
            loadUserData();
        } catch (error) {
            console.error('❌ Ошибка парсинга пользователя из localStorage:', error);
            localStorage.removeItem('currentUser');
            showAuth();
        }
    } else {
        console.log('👤 Пользователь не найден, показываем форму авторизации');
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
    
    if (!email || !password || !confirmPassword) {
        showMessage('Заполните все поля', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Пароли не совпадают', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Пароль должен быть не менее 6 символов', 'error');
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
            console.log('💾 Регистрация через localStorage...');
            // Fallback на localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            console.log('👥 Существующие пользователи:', users);
            
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
            
            console.log('🆕 Новый пользователь:', newUser);
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            console.log('💾 Пользователи сохранены в localStorage');
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
    
    console.log('🔐 Обработка входа...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('📧 Email:', email);
    console.log('🔑 Пароль:', password ? '***' : 'пустой');
    
    if (!email || !password) {
        showMessage('Заполните все поля', 'error');
        return;
    }
    
    try {
        if (supabaseClient && supabaseClient.initialized) {
            console.log('🚀 Вход через Supabase...');
            // Вход через Supabase
            const user = await supabaseClient.loginUser(email, password);
            currentUser = user;
            showApp();
            await loadUserData();
            showMessage(`Добро пожаловать, ${user.email}!`, 'success');
        } else {
            console.log('💾 Вход через localStorage...');
            // Fallback на localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            console.log('👥 Пользователи в localStorage:', users);
            
            const user = users.find(u => u.email === email && u.password === btoa(password));
            
            if (user) {
                console.log('✅ Пользователь найден:', user);
                currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(user));
                showApp();
                loadUserData();
                showMessage(`Добро пожаловать, ${user.email}!`, 'success');
            } else {
                console.log('❌ Пользователь не найден');
                showMessage('Неверный email или пароль', 'error');
            }
        }
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
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
    if (!currentUser) {
        console.log('❌ Нет текущего пользователя для загрузки данных');
        return;
    }
    
    console.log('📊 Загружаем данные для пользователя:', currentUser.id);
    
    try {
        if (supabaseClient && supabaseClient.initialized) {
            console.log('🚀 Загрузка данных из Supabase...');
            // Загрузка данных из Supabase
            const userData = await supabaseClient.loadUserData(currentUser.id);
            if (userData) {
                availableIngredients = userData.availableIngredients || [
                    "рис (~700 г)", "макароны", "капуста", "масло", "соль", "специи"
                ];
                menus = userData.menus || [];
                currentProducts = userData.currentProducts || [];
                boughtProducts = userData.boughtProducts || [];
                console.log('✅ Данные загружены из Supabase');
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
                
                console.log('✅ Данные загружены из localStorage');
                console.log('👥 Пользователи:', JSON.parse(localStorage.getItem('users') || '[]'));
                console.log('🔐 Текущий пользователь:', localStorage.getItem('currentUser'));
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
    console.log('💾 Начинаем сохранение данных пользователя...');
    console.log('👤 Текущий пользователь:', currentUser);
    
    if (!currentUser) {
        console.log('❌ Нет текущего пользователя, пропускаем сохранение');
        return;
    }
    
    try {
        if (supabaseClient && supabaseClient.initialized) {
            console.log('🗄️ Сохраняем в Supabase...');
            // Сохраняем в Supabase
            await supabaseClient.updateUserData(currentUser.id, {
                available_ingredients: availableIngredients,
                menus: menus
            });
            
            // Сохраняем продукты
            await supabaseClient.saveProducts(currentUser.id, currentProducts);
            
            console.log('✅ Данные сохранены в Supabase');
        } else {
            console.log('💾 Сохраняем в localStorage...');
            // Fallback на localStorage
            const userKey = `user_${currentUser.id}`;
            
            console.log('📦 Сохраняем купленные продукты:', boughtProducts.length, 'шт');
            localStorage.setItem(`${userKey}_boughtProducts`, JSON.stringify(boughtProducts));
            
            console.log('🥄 Сохраняем доступные ингредиенты:', availableIngredients.length, 'шт');
            localStorage.setItem(`${userKey}_availableIngredients`, JSON.stringify(availableIngredients));
            
            console.log('🍽️ Сохраняем меню:', menus.length, 'шт');
            localStorage.setItem(`${userKey}_menus`, JSON.stringify(menus));
            
            console.log('🛒 Сохраняем текущие продукты:', currentProducts.length, 'шт');
            localStorage.setItem(`${userKey}_currentProducts`, JSON.stringify(currentProducts));
            
            // Сохраняем общие данные
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('menus', JSON.stringify(menus));
            localStorage.setItem('boughtProducts', JSON.stringify(boughtProducts));
            localStorage.setItem('availableIngredients', JSON.stringify(availableIngredients));
            localStorage.setItem('currentProducts', JSON.stringify(currentProducts));
            
            console.log('✅ Все данные сохранены в localStorage');
            console.log('🔍 Проверьте в Developer Tools → Application → Local Storage');
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения данных:', error);
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
        console.log('🚀 Начинаем генерацию меню...');
        console.log('💰 Бюджет:', budget, '₽');
        console.log('📅 Дни:', days);
        console.log('🍽️ Прием пищи:', meal);
        console.log('📍 Начало:', start);
        
        // Генерация меню
        const menuPrompt = `Составь меню на ${days} дней для ${meal} с бюджетом ${budget} ₽, используя продукты из каталога Макси. Учитывай имеющиеся продукты: ${availableIngredients.join(', ')}. Формат: JSON с полями day, meal, recipe, ingredients [{ name, qty, unit }], cookingTime. Верни только JSON в кодовых блоках.`;
        
        console.log('🤖 Отправляем запрос на генерацию меню...');
        const menuResponse = await callGeminiAPI(menuPrompt);
        let menuData = parseJSONResponse(menuResponse);
        
        console.log('📋 Получены данные меню:', menuData);
        
        if (!menuData || !Array.isArray(menuData)) {
            throw new Error('Неверный формат ответа API');
        }

        // Получение цен для продуктов
        console.log('💰 Получаем цены для продуктов...');
        let productsWithPrices = await getProductsWithPrices(menuData, budget);
        
        console.log('💵 Стоимость продуктов:', productsWithPrices.totalCost, '₽');
        
        if (productsWithPrices.totalCost > budget) {
            console.log('⚠️ Превышение бюджета, пытаемся скорректировать...');
            // Попытка корректировки меню
            const adjustedMenu = await adjustMenuForBudget(menuData, budget, productsWithPrices.totalCost);
            if (adjustedMenu) {
                console.log('✅ Меню скорректировано');
                menuData = adjustedMenu;
                productsWithPrices = await getProductsWithPrices(menuData, budget);
                console.log('💵 Новая стоимость:', productsWithPrices.totalCost, '₽');
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

// Парсинг JSON ответа
function parseJSONResponse(response) {
    try {
        console.log('🔍 Парсим ответ API:', response.substring(0, 200) + '...');
        
        if (!response || typeof response !== 'string') {
            throw new Error('Ответ API не является строкой');
        }
        
        // Ищем JSON в кодовых блоках
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            console.log('📋 Найден JSON в кодовом блоке');
            return JSON.parse(jsonMatch[1]);
        }
        
        // Пытаемся распарсить как обычный JSON
        console.log('📋 Пытаемся распарсить как обычный JSON');
        return JSON.parse(response);
    } catch (error) {
        console.error('❌ Ошибка парсинга JSON:', error);
        console.error('📄 Ответ API:', response);
        throw new Error(`Не удалось распарсить ответ API: ${error.message}`);
    }
}

// Реальный каталог продуктов для Архангельска (цены в рублях)
const ARKHANGELSK_CATALOG = {
    // Мясо и птица
    "куриная грудка": { name: "Куриная грудка", price: 320, unit: "кг", pack: "1 кг" },
    "куриное филе": { name: "Куриное филе", price: 380, unit: "кг", pack: "1 кг" },
    "свинина": { name: "Свинина", price: 280, unit: "кг", pack: "1 кг" },
    "говядина": { name: "Говядина", price: 450, unit: "кг", pack: "1 кг" },
    "фарш говяжий": { name: "Фарш говяжий", price: 420, unit: "кг", pack: "1 кг" },
    "фарш свиной": { name: "Фарш свиной", price: 320, unit: "кг", pack: "1 кг" },
    
    // Рыба
    "треска": { name: "Филе трески", price: 280, unit: "кг", pack: "1 кг" },
    "минтай": { name: "Филе минтая", price: 220, unit: "кг", pack: "1 кг" },
    "сельдь": { name: "Сельдь", price: 180, unit: "кг", pack: "1 кг" },
    "лосось": { name: "Филе лосося", price: 650, unit: "кг", pack: "1 кг" },
    
    // Молочные продукты
    "молоко": { name: "Молоко 3.2%", price: 85, unit: "л", pack: "1 л" },
    "кефир": { name: "Кефир 3.2%", price: 75, unit: "л", pack: "1 л" },
    "сметана": { name: "Сметана 20%", price: 120, unit: "кг", pack: "400 г" },
    "творог": { name: "Творог 9%", price: 180, unit: "кг", pack: "200 г" },
    "сыр": { name: "Сыр Российский", price: 420, unit: "кг", pack: "200 г" },
    "масло сливочное": { name: "Масло сливочное 82.5%", price: 280, unit: "кг", pack: "180 г" },
    
    // Яйца
    "яйца": { name: "Яйца куриные", price: 120, unit: "дес", pack: "10 шт" },
    
    // Крупы и макароны
    "рис": { name: "Рис длиннозерный", price: 95, unit: "кг", pack: "900 г" },
    "гречка": { name: "Гречка ядрица", price: 120, unit: "кг", pack: "900 г" },
    "овсянка": { name: "Овсяные хлопья", price: 85, unit: "кг", pack: "800 г" },
    "макароны": { name: "Макароны", price: 75, unit: "кг", pack: "500 г" },
    "паста": { name: "Паста спагетти", price: 85, unit: "кг", pack: "500 г" },
    
    // Овощи
    "картофель": { name: "Картофель", price: 45, unit: "кг", pack: "1 кг" },
    "морковь": { name: "Морковь", price: 35, unit: "кг", pack: "1 кг" },
    "лук": { name: "Лук репчатый", price: 25, unit: "кг", pack: "1 кг" },
    "чеснок": { name: "Чеснок", price: 180, unit: "кг", pack: "100 г" },
    "огурцы": { name: "Огурцы", price: 120, unit: "кг", pack: "1 кг" },
    "помидоры": { name: "Помидоры", price: 180, unit: "кг", pack: "1 кг" },
    "капуста": { name: "Капуста белокочанная", price: 35, unit: "кг", pack: "1 кг" },
    "свекла": { name: "Свекла", price: 25, unit: "кг", pack: "1 кг" },
    "брокколи": { name: "Брокколи", price: 280, unit: "кг", pack: "400 г" },
    "цукини": { name: "Цукини", price: 180, unit: "кг", pack: "1 кг" },
    
    // Фрукты
    "яблоки": { name: "Яблоки", price: 120, unit: "кг", pack: "1 кг" },
    "бананы": { name: "Бананы", price: 140, unit: "кг", pack: "1 кг" },
    "апельсины": { name: "Апельсины", price: 160, unit: "кг", pack: "1 кг" },
    "лимон": { name: "Лимон", price: 180, unit: "кг", pack: "1 кг" },
    
    // Ягоды
    "клубника": { name: "Клубника", price: 450, unit: "кг", pack: "250 г" },
    "малина": { name: "Малина", price: 380, unit: "кг", pack: "250 г" },
    "черника": { name: "Черника", price: 420, unit: "кг", pack: "250 г" },
    
    // Масла и соусы
    "масло подсолнечное": { name: "Масло подсолнечное", price: 95, unit: "л", pack: "1 л" },
    "масло оливковое": { name: "Масло оливковое", price: 280, unit: "л", pack: "500 мл" },
    "томатная паста": { name: "Томатная паста", price: 65, unit: "кг", pack: "200 г" },
    "майонез": { name: "Майонез", price: 85, unit: "кг", pack: "250 г" },
    
    // Специи и приправы
    "соль": { name: "Соль поваренная", price: 25, unit: "кг", pack: "1 кг" },
    "сахар": { name: "Сахар-песок", price: 45, unit: "кг", pack: "1 кг" },
    "перец черный": { name: "Перец черный молотый", price: 180, unit: "кг", pack: "50 г" },
    "базилик": { name: "Базилик сушеный", price: 220, unit: "кг", pack: "30 г" },
    "укроп": { name: "Укроп свежий", price: 120, unit: "кг", pack: "100 г" },
    "петрушка": { name: "Петрушка свежая", price: 120, unit: "кг", pack: "100 г" },
    
    // Консервы
    "тушенка": { name: "Говядина тушеная", price: 280, unit: "кг", pack: "400 г" },
    "горошек зеленый": { name: "Горошек зеленый", price: 85, unit: "кг", pack: "400 г" },
    "кукуруза": { name: "Кукуруза сладкая", price: 95, unit: "кг", pack: "400 г" },
    "оливки": { name: "Оливки", price: 280, unit: "кг", pack: "200 г" },
    
    // Сладости
    "мед": { name: "Мед натуральный", price: 380, unit: "кг", pack: "500 г" },
    "шоколад": { name: "Шоколад молочный", price: 280, unit: "кг", pack: "100 г" },
    "печенье": { name: "Печенье", price: 120, unit: "кг", pack: "300 г" },
    
    // Напитки
    "чай": { name: "Чай черный", price: 180, unit: "кг", pack: "100 г" },
    "кофе": { name: "Кофе растворимый", price: 420, unit: "кг", pack: "100 г" },
    "сок": { name: "Сок апельсиновый", price: 120, unit: "л", pack: "1 л" },
    
    // Хлебобулочные
    "хлеб": { name: "Хлеб белый", price: 45, unit: "шт", pack: "1 шт" },
    "батон": { name: "Батон нарезка", price: 35, unit: "шт", pack: "1 шт" },
    "булочки": { name: "Булочки сдобные", price: 25, unit: "шт", pack: "1 шт" }
};

// Функция поиска продукта в каталоге
function findProductInCatalog(productName) {
    const normalizedName = productName.toLowerCase().trim();
    
    // Прямой поиск
    if (ARKHANGELSK_CATALOG[normalizedName]) {
        return ARKHANGELSK_CATALOG[normalizedName];
    }
    
    // Поиск по частичному совпадению
    for (const [key, product] of Object.entries(ARKHANGELSK_CATALOG)) {
        if (key.includes(normalizedName) || normalizedName.includes(key)) {
            return product;
        }
    }
    
    // Поиск по ключевым словам
    const keywords = {
        "мясо": "свинина",
        "курица": "куриная грудка",
        "рыба": "треска",
        "молоко": "молоко",
        "яйцо": "яйца",
        "картошка": "картофель",
        "морковка": "морковь",
        "луковица": "лук",
        "огурчик": "огурцы",
        "помидор": "помидоры",
        "капуста": "капуста",
        "свекла": "свекла",
        "яблоко": "яблоки",
        "банан": "бананы",
        "лимон": "лимон",
        "клубника": "клубника",
        "малина": "малина",
        "масло": "масло подсолнечное",
        "соль": "соль",
        "сахар": "сахар",
        "перец": "перец черный",
        "хлеб": "хлеб"
    };
    
    for (const [keyword, productKey] of Object.entries(keywords)) {
        if (normalizedName.includes(keyword)) {
            return ARKHANGELSK_CATALOG[productKey];
        }
    }
    
    // Если не найден, возвращаем базовый продукт
    return {
        name: productName,
        price: 150,
        unit: "шт",
        pack: "1 шт"
    };
}

// Получение цен для продуктов
async function getProductsWithPrices(menuData, budget) {
    const allIngredients = [];
    const products = [];
    let totalCost = 0;

    console.log('📋 Анализируем меню для сбора ингредиентов...');
    console.log('🍽️ Количество блюд:', menuData.length);

    // Сбор всех ингредиентов с учетом количества
    menuData.forEach((item, itemIndex) => {
        console.log(`📝 Блюдо ${itemIndex + 1}: ${item.meal} - ${item.recipe}`);
        
        if (item.ingredients && Array.isArray(item.ingredients)) {
            item.ingredients.forEach((ingredient, ingIndex) => {
                console.log(`  🥄 Ингредиент ${ingIndex + 1}: ${ingredient.name} ${ingredient.qty}${ingredient.unit}`);
                
                // Проверяем, есть ли уже такой ингредиент
                const existingIndex = allIngredients.findIndex(ing => 
                    ing.name.toLowerCase() === ingredient.name.toLowerCase()
                );
                
                if (existingIndex >= 0) {
                    // Добавляем количество к существующему ингредиенту
                    allIngredients[existingIndex].qty += ingredient.qty || 1;
                    console.log(`  ➕ Добавлено к существующему: ${allIngredients[existingIndex].qty}${allIngredients[existingIndex].unit}`);
                } else {
                    // Добавляем новый ингредиент
                    allIngredients.push({
                        name: ingredient.name,
                        qty: ingredient.qty || 1,
                        unit: ingredient.unit || 'шт'
                    });
                    console.log(`  🆕 Новый ингредиент добавлен`);
                }
            });
        }
    });

    console.log('📊 Всего уникальных ингредиентов:', allIngredients.length);
    allIngredients.forEach((ing, index) => {
        console.log(`  ${index + 1}. ${ing.name}: ${ing.qty}${ing.unit}`);
    });

    // Получение цен из каталога Архангельска
    for (let i = 0; i < allIngredients.length; i++) {
        const ingredient = allIngredients[i];
        
        try {
            console.log(`💰 [${i + 1}/${allIngredients.length}] Получаем цену для: ${ingredient.name}`);
            
            // Ищем продукт в каталоге Архангельска
            const catalogProduct = findProductInCatalog(ingredient.name);
            
            if (catalogProduct && catalogProduct.price) {
                // Рассчитываем стоимость с учетом количества
                let productCost = catalogProduct.price;
                
                // Конвертируем единицы измерения
                if (ingredient.unit === 'г' && catalogProduct.unit === 'кг') {
                    productCost = (catalogProduct.price * ingredient.qty) / 1000;
                } else if (ingredient.unit === 'мл' && catalogProduct.unit === 'л') {
                    productCost = (catalogProduct.price * ingredient.qty) / 1000;
                } else if (ingredient.unit === 'шт' && catalogProduct.unit === 'дес') {
                    productCost = (catalogProduct.price * ingredient.qty) / 10;
                } else {
                    productCost = catalogProduct.price * ingredient.qty;
                }
                
                const product = {
                    name: catalogProduct.name,
                    pack: catalogProduct.pack,
                    price: catalogProduct.price,
                    qty: ingredient.qty,
                    unit: ingredient.unit,
                    sum: Math.round(productCost * 100) / 100 // Округляем до копеек
                };
                
                console.log(`✅ Цена получена: ${product.name} - ${product.price} ₽ за ${product.pack}`);
                console.log(`   Итого: ${product.qty} × ${product.price} ₽ = ${product.sum} ₽`);
                
                products.push(product);
                totalCost += product.sum;
            } else {
                throw new Error('Продукт не найден в каталоге');
            }
        } catch (error) {
            console.warn(`⚠️ Ошибка получения цены для ${ingredient.name}:`, error);
            console.log(`💡 Используем базовую цену для ${ingredient.name}`);
            
            // Добавляем продукт с базовой ценой
            const product = {
                name: ingredient.name,
                pack: '~',
                price: 150,
                qty: ingredient.qty,
                unit: ingredient.unit,
                sum: 150 * ingredient.qty
            };
            products.push(product);
            totalCost += product.sum;
        }
    }

    console.log('💰 Итоговая стоимость:', totalCost, '₽');
    console.log('🛒 Количество продуктов:', products.length);

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
                updateMenuStatus(); // Обновляем статус меню
            });
            
            productsList.appendChild(productCard);
        }
    });

    // Список купленных продуктов
    if (boughtProductsDiv) {
        boughtProductsDiv.innerHTML = '';
        boughtProducts.forEach(index => {
            const product = currentProducts[index];
            const boughtItem = document.createElement('div');
            boughtItem.className = 'bought-item';
            boughtItem.innerHTML = `
                <span class="bought-name">${product.name}</span>
                <span class="bought-price">${product.sum.toFixed(2)} ₽</span>
            `;
            boughtProductsDiv.appendChild(boughtItem);
        });
    }

    // Общая сумма
    const totalCost = boughtProducts.reduce((sum, index) => sum + currentProducts[index].sum, 0);
    if (totalSum) {
        totalSum.innerHTML = `Итого куплено: <strong>${totalCost.toFixed(2)} ₽</strong>`;
    }

    // Прогресс-бар
    if (progressFill) {
        const progress = currentProducts.length > 0 ? (boughtProducts.length / currentProducts.length) * 100 : 0;
        progressFill.style.width = `${progress}%`;
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
    
    if (menus.length === 0) {
        menuContent.innerHTML = '<p>Сначала сгенерируйте меню</p>';
        return;
    }

    // Используем последнее сгенерированное меню
    currentMenu = menus[menus.length - 1];

    menuContent.innerHTML = `
        <div class="menu-header">
            <h3>Меню на ${currentMenu.days} дней (${currentMenu.meal})</h3>
            <p>Бюджет: ${currentMenu.totalCost} ₽</p>
            <div class="menu-status" id="menuStatus">
                <span class="status-indicator inactive">⏳ Ожидание покупки продуктов</span>
            </div>
        </div>
        
        <div id="menuItems"></div>
        
        <div class="menu-actions">
            <button class="btn btn-success" id="generateNewMenu">Сгенерировать новое меню</button>
        </div>
    `;

    // Добавить обработчики
    document.getElementById('generateNewMenu').addEventListener('click', () => switchTab('settings'));

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
    
    if (!currentMenu) {
        menuItems.innerHTML = '<p>Нет доступного меню</p>';
        return;
    }

    console.log('🍽️ Рендерим элементы меню...');
    console.log('📋 Текущее меню:', currentMenu);
    console.log('🥘 Количество блюд:', currentMenu.items ? currentMenu.items.length : 0);

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
                        </div>
                        <div class="meal-preview">
                            <p class="recipe-preview">${item.recipe.substring(0, 100)}${item.recipe.length > 100 ? '...' : ''}</p>
                        </div>
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
    modal.className = 'modal';
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