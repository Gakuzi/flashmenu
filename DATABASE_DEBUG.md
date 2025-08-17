# 🗄️ Отладка базы данных

## 🔍 Как проверить, что данные сохраняются:

### **1. Проверка в браузере:**
1. Откройте **Developer Tools** (F12)
2. Перейдите на вкладку **Console**
3. Попробуйте зарегистрироваться/войти
4. Посмотрите логи в консоли

### **2. Проверка localStorage:**
1. В **Developer Tools** → **Application**
2. Слева выберите **Local Storage**
3. Выберите ваш сайт
4. Проверьте ключи:
   - `users` - список пользователей
   - `currentUser` - текущий пользователь
   - `menus` - сохраненные меню

### **3. Проверка Supabase (если настроен):**
1. Перейдите в **Supabase Dashboard**
2. Выберите ваш проект
3. Перейдите в **Table Editor**
4. Проверьте таблицы:
   - `users` - пользователи
   - `menus` - меню
   - `products` - продукты

## 🚨 Возможные проблемы:

### **Проблема 1: Supabase не настроен**
```
⚠️ SUPABASE_CONFIG не настроен или содержит заглушки
💾 Supabase не настроен, используем localStorage
```

**Решение:** Настройте Supabase или используйте localStorage

### **Проблема 2: Ошибка подключения**
```
❌ Ошибка инициализации Supabase: [ошибка]
```

**Решение:** Проверьте URL и ключ в config.js

### **Проблема 3: Данные не сохраняются**
```
💾 Регистрация через localStorage...
🆕 Новый пользователь: {...}
```

**Решение:** Проверьте localStorage в Developer Tools

## 🔧 Как настроить Supabase:

### **1. Создайте проект в Supabase:**
1. Перейдите на https://supabase.com
2. Создайте новый проект
3. Получите URL и anon key

### **2. Обновите config.js:**
```javascript
window.SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

### **3. Создайте таблицы:**
```sql
-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица меню
CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Тестирование:

### **Локальное тестирование:**
1. Откройте `index.html`
2. Попробуйте зарегистрироваться
3. Проверьте localStorage
4. Попробуйте войти

### **Логи в консоли:**
```
🔐 Начинаем регистрацию...
💾 Регистрация через localStorage...
🆕 Новый пользователь: {id: 1234567890, email: "test@example.com", ...}
💾 Пользователи сохранены в localStorage
✅ Аккаунт успешно создан!
```

## 📊 Проверка данных:

### **В localStorage:**
```javascript
// Проверьте в консоли браузера:
console.log('Users:', JSON.parse(localStorage.getItem('users')));
console.log('Current User:', JSON.parse(localStorage.getItem('currentUser')));
console.log('Menus:', JSON.parse(localStorage.getItem('menus')));
```

### **В Supabase:**
1. Откройте **Table Editor**
2. Выберите таблицу `users`
3. Проверьте, есть ли записи

## 🎯 Результат:

**Если все работает правильно:**
- ✅ Пользователи сохраняются в localStorage/Supabase
- ✅ Меню сохраняются при генерации
- ✅ Данные загружаются при входе
- ✅ Нет ошибок в консоли

---

**Проверьте логи в консоли и сообщите, что видите!** 🔍 