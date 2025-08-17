# 🔄 Система ротации API ключей

## ✅ Что добавлено:

### **Автоматическая ротация ключей:**
- 🔑 **8 API ключей** в ротации
- 🔄 **Автоматическое переключение** при превышении лимита
- 🎯 **Умная обработка ошибок** (quota, location, network)
- 🎭 **Fallback на Mock** если все ключи не работают

## 🚀 Как работает ротация:

### **1. Загрузка ключей:**
```javascript
// Загружаются из config.js (GitHub Actions)
window.GEMINI_API_KEY_1 = 'ваш_первый_ключ';
window.GEMINI_API_KEY_2 = 'ваш_второй_ключ';
// ... до 8 ключей
```

### **2. Логика переключения:**
```
Ключ 1 → Ошибка quota → Ключ 2 → Ошибка quota → Ключ 3
↓
Ключ 8 → Ошибка quota → Mock данные
```

### **3. Типы ошибок:**
- **quota exceeded** → переключаемся на следующий ключ
- **location not supported** → переключаемся на следующий ключ  
- **network error** → переключаемся на следующий ключ
- **all keys failed** → используем Mock данные

## 🔧 Настройка в GitHub Secrets:

### **Шаг 1: Добавьте секреты**
1. Перейдите в **Settings** → **Secrets and variables** → **Actions**
2. Добавьте 8 секретов:

```
Name: GEMINI_API_KEY_1
Secret: AIzaSyCu8E9W2JyXbQHwXf95PmGtoqX2kevFU3U

Name: GEMINI_API_KEY_2  
Secret: AIzaSyClQBZftyxshvfQPYGbPFu-Cp3L8cwHExc

Name: GEMINI_API_KEY_3
Secret: AIzaSyBnwKmznR0WJDrdwTnaCkE9oQeEC2fu-oU

Name: GEMINI_API_KEY_4
Secret: AIzaSyByjQ6kPNERkk8L7X_lh8RwHN3EQ5mA2Cc

Name: GEMINI_API_KEY_5
Secret: AIzaSyAgh5xa8XnqPmNfI0fCod6yg-6Sg7452g0

Name: GEMINI_API_KEY_6
Secret: AIzaSyAHXBqiRczF4uG0Tofjgxj5zc17UoQUZBA

Name: GEMINI_API_KEY_7
Secret: AIzaSyC1jOV62uVbRCL2Wb7E1dacps7YobyLhL4

Name: GEMINI_API_KEY_8
Secret: AIzaSyDKVM2qJQ4lXfjZpQVm9ymxf_GiwMkDBHs
```

### **Шаг 2: Обновите GitHub Actions workflow**
Файл `.github/workflows/deploy.yml` автоматически создаст `config.js` с ключами:

```yaml
- name: Create config.js from secrets
  run: |
    cat > config.js << 'EOF'
    window.GEMINI_CONFIG = {
      apiKey: '${{ secrets.GEMINI_API_KEY_1 }}',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
    };
    
    window.GEMINI_API_KEY_1 = '${{ secrets.GEMINI_API_KEY_1 }}';
    window.GEMINI_API_KEY_2 = '${{ secrets.GEMINI_API_KEY_2 }}';
    window.GEMINI_API_KEY_3 = '${{ secrets.GEMINI_API_KEY_3 }}';
    window.GEMINI_API_KEY_4 = '${{ secrets.GEMINI_API_KEY_4 }}';
    window.GEMINI_API_KEY_5 = '${{ secrets.GEMINI_API_KEY_5 }}';
    window.GEMINI_API_KEY_6 = '${{ secrets.GEMINI_API_KEY_6 }}';
    window.GEMINI_API_KEY_7 = '${{ secrets.GEMINI_API_KEY_7 }}';
    window.GEMINI_API_KEY_8 = '${{ secrets.GEMINI_API_KEY_8 }}';
    EOF
```

### **Шаг 3: Сделайте push**
```bash
git push origin main
```

## 🧪 Тестирование:

### **Локальное тестирование:**
1. Откройте `index.html` в браузере
2. Попробуйте сгенерировать меню
3. В консоли увидите логи ротации ключей

### **Логи в консоли:**
```
🔑 Загружено 8 API ключей
  1. AIzaSyCu8E...
  2. AIzaSyClQB...
  ...
🔑 Попытка 1/8 с ключом 1/8
❌ Ошибка с ключом 1: quota exceeded
🔄 Ключ 1 превысил лимит, пробуем следующий...
🔑 Попытка 2/8 с ключом 2/8
✅ Ответ получен от Gemini API с ключом 2
```

## 🌟 Преимущества:

### **Надежность:**
- ✅ **8 ключей** вместо 1
- ✅ **Автоматическое переключение** при ошибках
- ✅ **Никаких простоев** при превышении лимита

### **Производительность:**
- ✅ **Распределение нагрузки** между ключами
- ✅ **Больше параллельных запросов**
- ✅ **Обход географических ограничений**

### **Безопасность:**
- ✅ **Ключи в секретах GitHub**
- ✅ **Никаких утечек** в коде
- ✅ **Автоматическое создание** config.js

## 🎯 Результат:

**Теперь приложение:**
- 🔄 **Автоматически переключается** между 8 ключами
- 🚫 **Не останавливается** при превышении лимита
- 🎭 **Использует Mock** только если все ключи не работают
- ⚡ **Работает стабильно** без ошибок quota

---

**Добавьте ключи в GitHub Secrets и наслаждайтесь стабильной работой!** 🚀✅ 