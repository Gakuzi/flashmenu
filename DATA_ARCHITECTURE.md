# 🗄️ Архитектура хранения данных Flash Menu

## 📍 **Где хранятся данные**

**ВСЕ данные хранятся в браузере пользователя в `localStorage`** - это встроенная база данных браузера, которая работает локально на устройстве пользователя.

### 🔍 **localStorage - что это?**

`localStorage` - это веб-хранилище браузера, которое:
- ✅ Сохраняет данные между сессиями
- ✅ Работает только на одном домене
- ✅ Имеет лимит ~5-10 МБ
- ✅ Доступен только через JavaScript
- ✅ Данные хранятся в виде строк

## 🔐 **Система пользователей**

### **1. Регистрация пользователя**

```javascript
// Функция handleRegister()
const newUser = {
    id: Date.now(),           // Уникальный ID пользователя (timestamp)
    email: email,             // Email для входа
    password: btoa(password), // Зашифрованный пароль (base64)
    createdAt: new Date().toISOString() // Дата создания
};

// Сохраняется в localStorage
users.push(newUser);
localStorage.setItem('users', JSON.stringify(users));
```

**Процесс регистрации:**
1. Пользователь вводит email и пароль
2. Проверяется уникальность email
3. Пароль шифруется (base64)
4. Создается объект пользователя
5. Пользователь добавляется в массив `users`
6. Массив сохраняется в localStorage

### **2. Вход пользователя**

```javascript
// Функция handleLogin()
const users = JSON.parse(localStorage.getItem('users') || '[]');
const user = users.find(u => 
    u.email === email && 
    u.password === btoa(password)
);

if (user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    loadUserData(); // Загружаем персональные данные
}
```

**Процесс входа:**
1. Пользователь вводит email и пароль
2. Ищется пользователь в массиве `users`
3. Проверяется соответствие email и пароля
4. При успехе сохраняется `currentUser`
5. Загружаются персональные данные пользователя

### **3. Структура пользователя**

```javascript
{
    id: 1703123456789,                    // Уникальный ID
    email: "user@example.com",            // Email для входа
    password: "encoded_password_base64",   // Зашифрованный пароль
    createdAt: "2024-01-01T12:00:00.000Z" // Дата создания
}
```

## 📊 **Структура данных в localStorage**

### **Глобальные данные (общие для всех):**

#### **Список всех пользователей:**
```javascript
localStorage.getItem('users') = [
    {
        id: 1703123456789,
        email: "user1@example.com",
        password: "encoded_password_1",
        createdAt: "2024-01-01T12:00:00.000Z"
    },
    {
        id: 1703123456790,
        email: "user2@example.com",
        password: "encoded_password_2",
        createdAt: "2024-01-01T13:00:00.000Z"
    }
];
```

#### **Текущий авторизованный пользователь:**
```javascript
localStorage.getItem('currentUser') = {
    id: 1703123456789,
    email: "user1@example.com"
};
```

### **Персональные данные (для каждого пользователя):**

Ключи формируются по схеме: `user_{userId}_{тип_данных}`

#### **Купленные продукты:**
```javascript
localStorage.getItem('user_1703123456789_boughtProducts') = [0, 2, 5];
// Массив индексов купленных продуктов из currentProducts
```

#### **Имеющиеся ингредиенты:**
```javascript
localStorage.getItem('user_1703123456789_availableIngredients') = [
    "рис (~700 г)",
    "макароны", 
    "капуста",
    "масло",
    "соль",
    "специи"
];
```

#### **Сгенерированные меню:**
```javascript
localStorage.getItem('user_1703123456789_menus') = [
    {
        id: 1703123456790,
        budget: 1500,
        days: 7,
        meal: "Все",
        start: "Сегодня с ужина",
        items: [
            {
                day: "День 1",
                meal: "Завтрак",
                recipe: "Овсянка с яблоками...",
                ingredients: [
                    {
                        name: "Овсяные хлопья",
                        qty: 100,
                        unit: "г"
                    }
                ],
                cookingTime: 10
            }
        ],
        totalCost: 1250.50,
        createdAt: "2024-01-01T14:00:00.000Z"
    }
];
```

#### **Текущий список продуктов для покупки:**
```javascript
localStorage.getItem('user_1703123456789_currentProducts') = [
    {
        name: "Куриное филе",
        pack: "500 г",
        price: 299.99,
        qty: 1,
        unit: "шт",
        sum: 299.99
    },
    {
        name: "Рис",
        pack: "900 г",
        price: 89.99,
        qty: 1,
        unit: "шт",
        sum: 89.99
    }
];
```

## 🔄 **Жизненный цикл данных**

### **1. При регистрации:**
```javascript
// Создается новый пользователь
// Добавляется в массив users
// Сохраняется в localStorage
```

### **2. При входе:**
```javascript
// Проверяется пользователь
// Загружаются его персональные данные
// Если данных нет - создаются базовые (ингредиенты)
```

### **3. При генерации меню:**
```javascript
// Создается новое меню
// Генерируется список продуктов
// Все сохраняется в localStorage
```

### **4. При покупке продуктов:**
```javascript
// Продукт отмечается как купленный
// Добавляется в availableIngredients
// Обновляется localStorage
```

### **5. При выходе:**
```javascript
// Удаляется currentUser
// Персональные данные остаются в localStorage
// При следующем входе загружаются снова
```

## 🛡️ **Безопасность данных**

### **Шифрование паролей:**
```javascript
// Простое шифрование (base64) - НЕ для продакшена!
password: btoa(password)

// Для продакшена используйте:
// - bcrypt
// - Argon2
// - PBKDF2
```

### **Изоляция данных:**
```javascript
// Каждый пользователь видит только свои данные
const userKey = `user_${currentUser.id}`;
// Данные изолированы по ID пользователя
```

### **Ограничения localStorage:**
- ❌ Данные видны в DevTools
- ❌ Можно легко изменить через консоль
- ❌ Нет серверной валидации
- ❌ Данные теряются при очистке браузера

## 🔧 **Функции работы с данными**

### **Загрузка данных:**
```javascript
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
```

### **Сохранение данных:**
```javascript
function saveUserData() {
    if (!currentUser) return;
    
    const userKey = `user_${currentUser.id}`;
    localStorage.setItem(`${userKey}_boughtProducts`, JSON.stringify(boughtProducts));
    localStorage.setItem(`${userKey}_availableIngredients`, JSON.stringify(availableIngredients));
    localStorage.setItem(`${userKey}_menus`, JSON.stringify(menus));
    localStorage.setItem(`${userKey}_currentProducts`, JSON.stringify(currentProducts));
}
```

## 🚀 **Альтернативы localStorage**

### **Для продакшена рекомендуется:**

#### **1. Серверная база данных:**
- PostgreSQL, MySQL, MongoDB
- Аутентификация через JWT
- API для всех операций

#### **2. Облачные решения:**
- Firebase Authentication + Firestore
- Supabase
- AWS Amplify

#### **3. Гибридный подход:**
- Кэширование в localStorage
- Синхронизация с сервером
- Офлайн режим

## 📋 **Чек-лист архитектуры**

- [x] Регистрация пользователей
- [x] Изоляция данных по пользователям
- [x] Сохранение всех типов данных
- [x] Автоматическая загрузка при входе
- [x] Базовое шифрование паролей
- [ ] Серверная валидация
- [ ] Синхронизация между устройствами
- [ ] Резервное копирование данных

---

**Текущая архитектура подходит для демонстрации и личного использования. Для продакшена рекомендуется перейти на серверную базу данных.** 🚀 