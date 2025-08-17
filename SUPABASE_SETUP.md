# 🗄️ Настройка Supabase для Flash Menu

## 🚀 Что такое Supabase?

**Supabase** - это бесплатная альтернатива Firebase с PostgreSQL базой данных. Предоставляет:
- ✅ **500MB бесплатно** навсегда
- ✅ **PostgreSQL** база данных
- ✅ **Встроенная авторизация**
- ✅ **Real-time** обновления
- ✅ **Автоматический API**
- ✅ **Dashboard** для управления

---

## 📋 Пошаговая настройка

### **Шаг 1: Регистрация на Supabase**

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **"Start your project"**
3. Войдите через **GitHub** (рекомендуется)
4. Нажмите **"New Project"**

### **Шаг 2: Создание проекта**

1. **Название проекта:** `flashmenu`
2. **Database Password:** придумайте сложный пароль (запишите!)
3. **Region:** выберите ближайший:
   - **West Europe** (Франкфурт) - для России
   - **North America** (Орегон) - для Америки
4. Нажмите **"Create new project"**

**⏱️ Время создания:** 2-5 минут

### **Шаг 3: Получение данных подключения**

После создания проекта:

1. Перейдите в **Settings → API**
2. Скопируйте:
   - **Project URL** (например: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (начинается с `eyJ...`)

### **Шаг 4: Настройка базы данных**

1. Перейдите в **SQL Editor**
2. Скопируйте содержимое файла `supabase-setup.sql`
3. Вставьте в SQL Editor
4. Нажмите **"Run"**

**✅ Результат:** Созданы таблицы, индексы, политики безопасности

---

## 🔧 Настройка приложения

### **1. Создайте файл `config.js`:**

```javascript
// config.js - Конфигурация Flash Menu
// НЕ добавляйте в Git!

window.SUPABASE_CONFIG = {
    // Данные из Supabase Dashboard → Settings → API
    url: 'https://your-project-id.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

window.GEMINI_CONFIG = {
    // Ваш API ключ Gemini
    apiKey: '[ВАШ_API_КЛЮЧ]',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

console.log('✅ Конфигурация загружена');
```

### **2. Обновите `index.html`:**

```html
<!-- Подключаем Supabase -->
<script src="supabase-client.js"></script>

<!-- Конфигурация -->
<script src="config.js"></script>

<!-- Основное приложение -->
<script src="app.js"></script>
```

### **3. Инициализация в `app.js`:**

```javascript
// Инициализация Supabase
let supabaseClient = null;

async function initSupabase() {
    if (window.SUPABASE_CONFIG) {
        try {
            supabaseClient = new SupabaseClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            
            const isConnected = await supabaseClient.init();
            if (isConnected) {
                console.log('✅ Supabase подключен');
                await supabaseClient.createTables();
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка Supabase:', error);
        }
    }
    
    console.log('⚠️ Используем localStorage');
    return false;
}

// Вызов при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    await initSupabase();
    // ... остальной код
});
```

---

## 🧪 Тестирование

### **1. Проверка подключения:**

```javascript
// В консоли браузера
await supabaseClient.checkConnection();
// Должно вернуть true
```

### **2. Тест регистрации:**

```javascript
// Регистрация тестового пользователя
const user = await supabaseClient.registerUser(
    'test@example.com',
    'password123'
);
console.log('Пользователь создан:', user);
```

### **3. Тест входа:**

```javascript
// Вход пользователя
const user = await supabaseClient.loginUser(
    'test@example.com',
    'password123'
);
console.log('Пользователь вошел:', user);
```

---

## 🛡️ Безопасность

### **RLS (Row Level Security):**
- ✅ Пользователи видят только свои данные
- ✅ Автоматическая проверка прав доступа
- ✅ Безопасные API endpoints

### **Авторизация:**
- ✅ JWT токены
- ✅ Автоматическое обновление
- ✅ Безопасные сессии

---

## 📊 Структура базы данных

### **Таблица `users`:**
- `id` - UUID (ссылка на auth.users)
- `email` - email пользователя
- `available_ingredients` - массив ингредиентов
- `created_at` - дата создания
- `updated_at` - дата обновления

### **Таблица `menus`:**
- `id` - UUID меню
- `user_id` - ссылка на пользователя
- `budget` - бюджет
- `days` - количество дней
- `meal` - тип питания
- `items` - JSON с блюдами
- `total_cost` - общая стоимость

### **Таблица `products`:**
- `id` - UUID записи
- `user_id` - ссылка на пользователя
- `products` - JSON с продуктами
- `updated_at` - дата обновления

---

## 🚨 Устранение неполадок

### **Ошибка подключения:**
1. Проверьте **Project URL** и **anon key**
2. Убедитесь, что проект **активен**
3. Проверьте **регион** проекта

### **Ошибка создания таблиц:**
1. Выполните SQL скрипт в **SQL Editor**
2. Проверьте права доступа
3. Убедитесь, что RLS включен

### **Ошибка авторизации:**
1. Проверьте настройки **Authentication**
2. Убедитесь, что **Email auth** включен
3. Проверьте **Site URL** в настройках

---

## 📈 Мониторинг

### **Supabase Dashboard:**
- **Database** - просмотр таблиц и данных
- **Authentication** - управление пользователями
- **API** - мониторинг запросов
- **Logs** - просмотр ошибок

### **Метрики:**
- Количество пользователей
- Объем данных
- Количество запросов
- Время ответа

---

## 🔄 Миграция с localStorage

### **Автоматическая миграция:**

```javascript
async function migrateFromLocalStorage() {
    if (!supabaseClient) return;
    
    const currentUser = await supabaseClient.getCurrentUser();
    if (!currentUser) return;
    
    // Получаем данные из localStorage
    const localData = {
        availableIngredients: JSON.parse(localStorage.getItem('availableIngredients') || '[]'),
        menus: JSON.parse(localStorage.getItem('menus') || '[]'),
        currentProducts: JSON.parse(localStorage.getItem('currentProducts') || '[]')
    };
    
    // Синхронизируем с Supabase
    await supabaseClient.syncUserData(currentUser.id, localData);
    
    console.log('✅ Миграция завершена');
}
```

---

## 🎯 Результат

После настройки у вас будет:

1. **✅ Онлайн база данных** PostgreSQL
2. **✅ Автоматическая авторизация**
3. **✅ Синхронизация** между устройствами
4. **✅ Безопасность** на уровне базы данных
5. **✅ Масштабируемость** для роста
6. **✅ Бесплатно** навсегда

---

## 🚀 Следующие шаги

1. **Создайте проект** на Supabase
2. **Выполните SQL скрипт**
3. **Настройте конфигурацию**
4. **Протестируйте подключение**
5. **Запустите приложение**

**Готово! Теперь у вас профессиональная онлайн база данных!** 🎉 