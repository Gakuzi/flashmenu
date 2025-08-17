# 🔒 Безопасность API ключей

## ⚠️ **ВАЖНО: Текущий API ключ скомпрометирован!**

API ключ `AIzaSyDKVM2qJQ4lXfjZpQVm9ymxf_GiwMkDBHs` был обнаружен в публичном репозитории и должен быть заменен.

## 🚨 **Немедленные действия:**

1. **Отзовите текущий ключ** в Google Cloud Console
2. **Создайте новый ключ** с ограничениями
3. **Настройте ограничения доступа** для нового ключа

## 🔧 **Варианты безопасной настройки:**

### **Вариант 1: Переменные окружения + серверная часть (РЕКОМЕНДУЕТСЯ)**

#### 1.1 Создайте файл `.env`:
```bash
# .env (НЕ добавляйте в Git!)
GEMINI_API_KEY=ваш_новый_ключ_здесь
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

#### 1.2 Создайте простой сервер (Node.js):
```javascript
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await fetch(process.env.GEMINI_API_URL, {
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
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
```

#### 1.3 Обновите клиентский код:
```javascript
// Вместо прямого вызова Gemini API
async function callGeminiAPI(prompt) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        throw new Error('Ошибка сервера');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
```

### **Вариант 2: Прокси-сервер (GitHub Pages)**

#### 2.1 Создайте Netlify/Vercel функцию:
```javascript
// netlify/functions/gemini.js
exports.handler = async (event) => {
    const { prompt } = JSON.parse(event.body);
    
    const response = await fetch(process.env.GEMINI_API_URL, {
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
    
    const data = await response.json();
    
    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };
};
```

#### 2.2 Обновите клиентский код:
```javascript
async function callGeminiAPI(prompt) {
    const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        throw new Error('Ошибка API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
```

### **Вариант 3: Улучшенное шифрование (временное решение)**

#### 3.1 Создайте файл конфигурации:
```javascript
// config.js (НЕ добавляйте в Git!)
const API_CONFIG = {
    // Используйте более сложное шифрование
    encryptedKey: encryptApiKey('ваш_новый_ключ'),
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

function encryptApiKey(key) {
    // Простое шифрование (не для продакшена)
    return btoa(key.split('').reverse().join(''));
}

function decryptApiKey(encrypted) {
    try {
        return atob(encrypted).split('').reverse().join('');
    } catch (error) {
        return null;
    }
}
```

## 🛡️ **Рекомендации по безопасности:**

### **Для разработки:**
- Используйте `.env` файлы (добавьте в `.gitignore`)
- Никогда не коммитьте API ключи
- Используйте локальные серверы

### **Для продакшена:**
- Используйте серверную часть
- Настройте CORS ограничения
- Добавьте rate limiting
- Используйте HTTPS

### **Для GitHub Pages:**
- Используйте Netlify/Vercel функции
- Настройте переменные окружения в панели управления
- Ограничьте доступ к API по доменам

## 📋 **Чек-лист безопасности:**

- [ ] Отозвать скомпрометированный ключ
- [ ] Создать новый ключ с ограничениями
- [ ] Настроить доменные ограничения
- [ ] Добавить `.env` в `.gitignore`
- [ ] Настроить серверную часть или прокси
- [ ] Протестировать безопасность

## 🔗 **Полезные ссылки:**

- [Google Cloud Console](https://console.cloud.google.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Vercel Functions](https://vercel.com/docs/functions)
- [GitHub Security](https://docs.github.com/en/code-security/)

---

**Помните: безопасность API ключей критически важна для защиты вашего приложения!** 🚨 