# 🚀 Настройка GitHub Database для Flash Menu

## 📋 Пошаговая инструкция

### **Шаг 1: Создание GitHub токена**

1. Перейдите на [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Нажмите "Generate new token (classic)"
3. Выберите следующие разрешения:
   - ✅ `repo` - Полный доступ к репозиториям
   - ✅ `workflow` - Управление GitHub Actions
4. Скопируйте токен (он показывается только один раз!)

### **Шаг 2: Настройка репозитория**

1. В вашем репозитории `flashmenu` создайте папку `database/`
2. Добавьте все файлы из папки `database/` в репозиторий
3. Закоммитьте и отправьте изменения

### **Шаг 3: Настройка приложения**

1. Откройте `index.html`
2. Добавьте настройки GitHub в секцию `<script>`:

```javascript
// Настройки GitHub Database
const GITHUB_CONFIG = {
    owner: 'Gakuzi',           // Ваш GitHub username
    repo: 'flashmenu',         // Название репозитория
    token: 'YOUR_TOKEN_HERE'   // Ваш GitHub токен
};

// Инициализация GitHub Database
let githubDB = null;

// Функция инициализации
async function initGitHubDB() {
    if (GITHUB_CONFIG.token === 'YOUR_TOKEN_HERE') {
        console.warn('GitHub токен не настроен, используем localStorage');
        return false;
    }
    
    try {
        githubDB = new GitHubDB(GITHUB_CONFIG.owner, GITHUB_CONFIG.repo, GITHUB_CONFIG.token);
        
        // Проверяем подключение
        const isConnected = await githubDB.testConnection();
        if (isConnected) {
            console.log('✅ GitHub Database подключена');
            return true;
        } else {
            console.error('❌ Ошибка подключения к GitHub Database');
            return false;
        }
    } catch (error) {
        console.error('Ошибка инициализации GitHub Database:', error);
        return false;
    }
}
```

### **Шаг 4: Интеграция с приложением**

Замените функции localStorage на GitHub Database:

```javascript
// Вместо localStorage
// localStorage.setItem('users', JSON.stringify(users));

// Используйте GitHub Database
if (githubDB) {
    await githubDB.saveUser(newUser);
} else {
    // Fallback на localStorage
    localStorage.setItem('users', JSON.stringify(users));
}
```

## 🔧 Конфигурация

### **Файл конфигурации:**
Создайте файл `config.js` (НЕ добавляйте в Git!):

```javascript
// config.js - НЕ добавляйте в Git!
window.GITHUB_CONFIG = {
    owner: 'Gakuzi',
    repo: 'flashmenu',
    token: 'ghp_your_actual_token_here'
};
```

### **Добавьте в .gitignore:**
```gitignore
# Конфиденциальные данные
config.js
.env
*.token
```

## 🛡️ Безопасность

### **Ограничения токена:**
- ✅ Только для конкретного репозитория
- ✅ Минимальные необходимые разрешения
- ✅ Регулярно обновляйте токен

### **Ограничения доступа:**
- ✅ Приватный репозиторий для конфиденциальных данных
- ✅ Публичный репозиторий только для демо

## 📊 Тестирование

### **1. Проверка подключения:**
```javascript
// В консоли браузера
await githubDB.testConnection();
// Должно вернуть true
```

### **2. Тест создания пользователя:**
```javascript
const testUser = {
    id: 'test_user',
    email: 'test@example.com',
    passwordHash: 'test_hash',
    createdAt: new Date().toISOString()
};

await githubDB.saveUser(testUser);
// Должно вернуть true
```

### **3. Проверка файлов:**
- Перейдите в репозиторий GitHub
- Проверьте папку `database/`
- Должны появиться новые файлы

## 🚨 Устранение неполадок

### **Ошибка 401 (Unauthorized):**
- Проверьте правильность токена
- Убедитесь, что токен не истек
- Проверьте разрешения токена

### **Ошибка 403 (Forbidden):**
- Проверьте права доступа к репозиторию
- Убедитесь, что токен имеет права на запись

### **Ошибка 404 (Not Found):**
- Проверьте правильность owner/repo
- Убедитесь, что репозиторий существует

### **Ошибка 422 (Validation Failed):**
- Проверьте формат данных
- Убедитесь, что файл не слишком большой

## 📈 Производительность

### **Ограничения GitHub API:**
- **Аутентифицированные запросы:** 5000/час
- **Размер файла:** максимум 100MB
- **Задержка:** 1-3 секунды

### **Рекомендации:**
- Кэшируйте данные в localStorage
- Обновляйте только измененные данные
- Используйте batch операции

## 🔄 Миграция данных

### **Из localStorage в GitHub:**
```javascript
async function migrateToGitHub() {
    if (!githubDB) return;
    
    // Получаем данные из localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Переносим в GitHub
    for (const user of users) {
        await githubDB.saveUser(user);
    }
    
    console.log('Миграция завершена');
}
```

## 🎯 Результат

После настройки у вас будет:
- ✅ Онлайн база данных на GitHub
- ✅ Синхронизация между устройствами
- ✅ История изменений
- ✅ Бесплатное хранение
- ✅ Резервное копирование

---

**Готово! Теперь ваше приложение будет использовать GitHub как онлайн базу данных.** 🚀 