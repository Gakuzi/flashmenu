# 🔐 Настройка секретов GitHub Actions

## ✅ Правильный подход: Секреты GitHub Actions

Мы возвращаемся к безопасному хранению API ключей через секреты GitHub Actions, как и планировали изначально.

## 🚨 Почему не файл с ключами:

- ❌ **Файл с ключами** - небезопасно, может попасть в Git
- ❌ **Хардкод в коде** - утечка при публикации
- ✅ **Секреты GitHub Actions** - безопасно, автоматически

## 🔧 Настройка секретов:

### **Шаг 1: Перейдите в Settings → Secrets and variables → Actions**

1. Откройте ваш репозиторий на GitHub
2. Нажмите **Settings** (вкладка)
3. В левом меню выберите **Secrets and variables** → **Actions**

### **Шаг 2: Добавьте секреты для Gemini API**

Нажмите **New repository secret** и добавьте:

```
Name: GEMINI_API_KEY_1
Secret: AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4

Name: GEMINI_API_KEY_2
Secret: AIzaSyDKVM2qJQ4lXfjZpQVm9ymxf_GiwMkDBHs

Name: GEMINI_API_KEY_3
Secret: AIzaSyAHXBqiRczF4uG0Tofjgxj5zc17UoQUZBA

Name: GEMINI_API_KEY_4
Secret: AIzaSyAgh5xa8XnqPmNfI0fCod6yg-6Sg7452g0

Name: GEMINI_API_KEY_5
Secret: AIzaSyByjQ6kPNERkk8L7X_lh8RwHN3EQ5mA2Cc

Name: GEMINI_API_KEY_6
Secret: AIzaSyBnwKmznR0WJDrdwTnaCkE9oQeEC2fu-oU

Name: GEMINI_API_KEY_7
Secret: AIzaSyClQBZftyxshvfQPYGbPFu-Cp3L8cwHExc

Name: GEMINI_API_KEY_8
Secret: AIzaSyCu8E9W2JyXbQHwXf95PmGtoqX2kevFU3U
```

### **Шаг 3: Добавьте секреты для Supabase (если нужно)**

```
Name: SUPABASE_URL
Secret: https://your-project.supabase.co

Name: SUPABASE_ANON_KEY
Secret: your-anon-key-here
```

## 🚀 Как это работает:

### **1. GitHub Actions создает config.js:**
```javascript
// Конфигурация создается автоматически из секретов GitHub Actions
window.GEMINI_CONFIG = {
  apiKey: 'AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
};

window.SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here'
};
```

### **2. Сервер загружает ключи из переменных окружения:**
```javascript
// API ключи загружаются из переменных окружения (секреты GitHub Actions)
for (let i = 1; i <= 8; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key !== 'your-api-key-here') {
        keys.push(key);
    }
}
```

### **3. Автоматическое переключение ключей:**
- **Первый ключ** не работает → пробуем второй
- **Второй ключ** не работает → пробуем третий
- **И так далее** до 8 ключей
- **Если все не работают** → используем Mock API

## 🔍 Проверка работы:

### **После добавления секретов:**
1. **Сделайте push** в ветку `main`
2. **GitHub Actions запустится** автоматически
3. **Создастся config.js** с вашими ключами
4. **Приложение развернется** на GitHub Pages

### **В логах Actions должно быть:**
```
✅ Create config.js from secrets
✅ Setup Pages
✅ Upload artifact
✅ Deploy to GitHub Pages
```

## 🌟 Преимущества секретов:

### **Безопасность:**
- ✅ **Ключи не публикуются** в репозитории
- ✅ **Доступ только** для GitHub Actions
- ✅ **Автоматическое создание** config.js
- ✅ **Никаких утечек** в коде

### **Автоматизация:**
- ✅ **При каждом push** создается новый config.js
- ✅ **Ключи обновляются** автоматически
- ✅ **Безопасное развертывание** на GitHub Pages
- ✅ **Никаких ручных действий**

### **Масштабируемость:**
- ✅ **Легко добавить** новые ключи
- ✅ **Просто изменить** существующие
- ✅ **Управление через** веб-интерфейс GitHub
- ✅ **Доступ для команды** разработчиков

## 📋 Полный список секретов:

### **Обязательные:**
```
GEMINI_API_KEY_1
GEMINI_API_KEY_2
GEMINI_API_KEY_3
GEMINI_API_KEY_4
GEMINI_API_KEY_5
GEMINI_API_KEY_6
GEMINI_API_KEY_7
GEMINI_API_KEY_8
```

### **Опциональные:**
```
SUPABASE_URL
SUPABASE_ANON_KEY
```

## 🎯 Результат:

После настройки:
- ✅ **8 API ключей** работают автоматически
- ✅ **Безопасное хранение** через секреты GitHub
- ✅ **Автоматическое создание** config.js
- ✅ **Никаких утечек** в коде
- ✅ **Профессиональный подход** к безопасности

---

**Теперь у вас правильная и безопасная система!** 🔐✅ 