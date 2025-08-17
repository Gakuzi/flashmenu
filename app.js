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
    
    const mockMenu = {
        "menu": {
            "Понедельник": {
                "Завтрак": {
                    "name": "Овсяная каша с фруктами",
                    "ingredients": [
                        {"name": "Овсяные хлопья", "amount": "100г", "price": 45},
                        {"name": "Молоко", "amount": "200мл", "price": 35},
                        {"name": "Банан", "amount": "1шт", "price": 25},
                        {"name": "Мед", "amount": "1ч.л.", "price": 15}
                    ]
                },
                "Обед": {
                    "name": "Куриный суп с овощами",
                    "ingredients": [
                        {"name": "Куриная грудка", "amount": "150г", "price": 120},
                        {"name": "Картофель", "amount": "2шт", "price": 20},
                        {"name": "Морковь", "amount": "1шт", "price": 15},
                        {"name": "Лук", "amount": "1шт", "price": 10},
                        {"name": "Зелень", "amount": "по вкусу", "price": 25}
                    ]
                },
                "Ужин": {
                    "name": "Греческий салат",
                    "ingredients": [
                        {"name": "Огурцы", "amount": "2шт", "price": 30},
                        {"name": "Помидоры", "amount": "2шт", "price": 40},
                        {"name": "Сыр фета", "amount": "50г", "price": 80},
                        {"name": "Оливки", "amount": "10шт", "price": 45},
                        {"name": "Оливковое масло", "amount": "2ст.л.", "price": 20}
                    ]
                }
            },
            "Вторник": {
                "Завтрак": {
                    "name": "Творожная запеканка",
                    "ingredients": [
                        {"name": "Творог", "amount": "200г", "price": 60},
                        {"name": "Яйца", "amount": "2шт", "price": 30},
                        {"name": "Сахар", "amount": "2ст.л.", "price": 10},
                        {"name": "Сметана", "amount": "2ст.л.", "price": 20}
                    ]
                },
                "Обед": {
                    "name": "Паста с томатным соусом",
                    "ingredients": [
                        {"name": "Паста", "amount": "100г", "price": 40},
                        {"name": "Томатная паста", "amount": "2ст.л.", "price": 25},
                        {"name": "Чеснок", "amount": "2зубчика", "price": 10},
                        {"name": "Базилик", "amount": "по вкусу", "price": 30}
                    ]
                },
                "Ужин": {
                    "name": "Рыба на пару с овощами",
                    "ingredients": [
                        {"name": "Филе трески", "amount": "150г", "price": 180},
                        {"name": "Брокколи", "amount": "100г", "price": 50},
                        {"name": "Цукини", "amount": "1шт", "price": 35},
                        {"name": "Лимон", "amount": "1/2шт", "price": 20}
                    ]
                }
            },
            "Среда": {
                "Завтрак": {
                    "name": "Смузи с ягодами",
                    "ingredients": [
                        {"name": "Клубника", "amount": "100г", "price": 80},
                        {"name": "Малина", "amount": "50г", "price": 60},
                        {"name": "Йогурт", "amount": "150мл", "price": 45},
                        {"name": "Мед", "amount": "1ч.л.", "price": 15}
                    ]
                },
                "Обед": {
                    "name": "Салат Цезарь",
                    "ingredients": [
                        {"name": "Куриная грудка", "amount": "100г", "price": 80},
                        {"name": "Салат Айсберг", "amount": "1/2шт", "price": 40},
                        {"name": "Сухарики", "amount": "2ст.л.", "price": 15},
                        {"name": "Пармезан", "amount": "30г", "price": 90},
                        {"name": "Соус Цезарь", "amount": "2ст.л.", "price": 35}
                    ]
                },
                "Ужин": {
                    "name": "Овощное рагу",
                    "ingredients": [
                        {"name": "Картофель", "amount": "3шт", "price": 30},
                        {"name": "Морковь", "amount": "2шт", "price": 30},
                        {"name": "Лук", "amount": "1шт", "price": 10},
                        {"name": "Чеснок", "amount": "3зубчика", "price": 15},
                        {"name": "Растительное масло", "amount": "2ст.л.", "price": 10}
                    ]
                }
            }
        }
    };
    
    return JSON.stringify(mockMenu, null, 2);
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

    // Получение цен по одному продукту
    for (let i = 0; i < allIngredients.length; i++) {
        const ingredient = allIngredients[i];
        
        try {
            console.log(`💰 [${i + 1}/${allIngredients.length}] Получаем цену для: ${ingredient.name}`);
            
            const pricePrompt = `Найди цену для продукта "${ingredient.name}" в каталоге Макси. Формат ответа: JSON с полями name, pack, price. Если продукт не найден, предложи аналог. Верни только JSON.`;
            
            const priceResponse = await callGeminiAPI(pricePrompt);
            const priceData = parseJSONResponse(priceResponse);
            
            if (priceData && priceData.price) {
                const product = {
                    name: priceData.name,
                    pack: priceData.pack,
                    price: parseFloat(priceData.price),
                    qty: ingredient.qty,
                    unit: ingredient.unit,
                    sum: parseFloat(priceData.price) * ingredient.qty
                };
                
                console.log(`✅ Цена получена: ${product.name} - ${product.price} ₽ за ${product.pack}`);
                console.log(`   Итого: ${product.qty} × ${product.price} ₽ = ${product.sum} ₽`);
                
                products.push(product);
                totalCost += product.sum;
            } else {
                throw new Error('Неверный формат данных о цене');
            }
        } catch (error) {
            console.warn(`⚠️ Ошибка получения цены для ${ingredient.name}:`, error);
            console.log(`💡 Используем примерную цену для ${ingredient.name}`);
            
            // Добавляем продукт с примерной ценой
            const product = {
                name: ingredient.name,
                pack: '~',
                price: 150, // Более реалистичная цена
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
    
    console.log('🔄 Обновляем селектор меню...');
    console.log('📋 Доступные меню:', menus);
    
    selector.innerHTML = '<option value="">Выберите меню...</option>';
    
    if (menus.length === 0) {
        console.log('⚠️ Нет доступных меню');
        return;
    }
    
    menus.forEach((menu, index) => {
        const option = document.createElement('option');
        option.value = menu.id;
        
        // Форматируем дату создания
        const createdDate = new Date(menu.createdAt);
        const dateStr = createdDate.toLocaleDateString('ru-RU');
        
        // Подсчитываем количество блюд
        const totalDishes = menu.items ? menu.items.length : 0;
        
        option.textContent = `Меню на ${menu.days} дней (${menu.meal}) - ${totalDishes} блюд, ${menu.totalCost} ₽ - ${dateStr}`;
        selector.appendChild(option);
        
        console.log(`📝 Меню ${index + 1}: ${option.textContent}`);
    });
    
    console.log('✅ Селектор меню обновлен');
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

    console.log('🍽️ Рендерим элементы меню...');
    console.log('📋 Текущее меню:', currentMenu);
    console.log('🥘 Количество блюд:', currentMenu.items ? currentMenu.items.length : 0);

    menuItems.innerHTML = '';
    
    if (!currentMenu.items || currentMenu.items.length === 0) {
        menuItems.innerHTML = '<p>В выбранном меню нет блюд</p>';
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

    console.log('📅 Блюда по дням:', dishesByDay);

    // Рендерим каждый день
    Object.keys(dishesByDay).forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `<h3>${day}</h3>`;
        menuItems.appendChild(dayHeader);

        // Рендерим блюда для этого дня
        dishesByDay[day].forEach((item, index) => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            
            const ingredientsList = item.ingredients ? item.ingredients.map(ing => 
                `${ing.name} ${ing.qty} ${ing.unit}`
            ).join(', ') : '';

            recipeCard.innerHTML = `
                <div class="recipe-header">
                    <div class="recipe-title">${item.meal}</div>
                    ${item.cookingTime ? `<div class="recipe-time">⏱️ ${item.cookingTime} мин</div>` : ''}
                </div>
                <div class="recipe-ingredients">
                    <strong>🥄 Ингредиенты:</strong> ${ingredientsList}
                </div>
                <div class="recipe-description">
                    <strong>📝 Рецепт:</strong> ${item.recipe}
                </div>
                ${item.cookingTime ? `<button class="btn btn-primary" onclick="startTimer(${item.cookingTime})">⏰ Запустить таймер</button>` : ''}
            `;
            
            menuItems.appendChild(recipeCard);
            console.log(`✅ Блюдо ${index + 1} для ${day}: ${item.meal} - ${item.recipe}`);
        });
    });

    console.log('✅ Элементы меню отрендерены');
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