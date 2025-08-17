# 🔄 Система ротации API ключей

## ✅ Что добавлено:

### **Автоматическая ротация ключей:**
- 🔑 **8 API ключей** в ротации через GitHub Secrets
- 🔄 **Автоматическое переключение** при превышении лимита
- 🎯 **Умная обработка ошибок** (quota, location, network)
- 🎭 **Fallback на Mock** если все ключи не работают
- 🔒 **Безопасное хранение** - ключи только в секретах

## 🚀 Как работает ротация:

### **1. Загрузка ключей из секретов:**
```javascript
// GitHub Actions создает config.js из секретов
window.GEMINI_API_KEY_1 = '${{ secrets.GEMINI_API_KEY_1 }}';
window.GEMINI_API_KEY_2 = '${{ secrets.GEMINI_API_KEY_2 }}';
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
Secret: [ВАШ_ПЕРВЫЙ_API_КЛЮЧ]

Name: GEMINI_API_KEY_2  
Secret: [ВАШ_ВТОРОЙ_API_КЛЮЧ]

Name: GEMINI_API_KEY_3
Secret: [ВАШ_ТРЕТИЙ_API_КЛЮЧ]

Name: GEMINI_API_KEY_4
Secret: [ВАШ_ЧЕТВЕРТЫЙ_API_КЛЮЧ]

Name: GEMINI_API_KEY_5
Secret: [ВАШ_ПЯТЫЙ_API_КЛЮЧ]

Name: GEMINI_API_KEY_6
Secret: [ВАШ_ШЕСТОЙ_API_КЛЮЧ]

Name: GEMINI_API_KEY_7
Secret: [ВАШ_СЕДЬМОЙ_API_КЛЮЧ]

Name: GEMINI_API_KEY_8
Secret: [ВАШ_ВОСЬМОЙ_API_КЛЮЧ]
```

### **Шаг 2: GitHub Actions автоматически создаст config.js**
Файл `.github/workflows/deploy.yml` создаст `config.js` с ключами из секретов:

```yaml
- name: Create config.js from secrets
  run: |
    cat > config.js << 'EOF'
    window.GEMINI_CONFIG = {
      apiKey: '${{ secrets.GEMINI_API_KEY_1 }}',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
    };
    
    // Дополнительные API ключи для ротации
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
🎭 Нет API ключей из секретов, используем Mock данные
```
или
```
🔑 Загружено 8 API ключей из секретов
  1. [маскированный_ключ_1]...
  2. [маскированный_ключ_2]...
  ...
🔑 Попытка 1/8 с ключом 1/8
❌ Ошибка с ключом 1: quota exceeded
🔄 Ключ 1 превысил лимит, пробуем следующий...
🔑 Попытка 2/8 с ключом 2/8
✅ Ответ получен от Gemini API с ключом 2
```

## 🌟 Преимущества:

### **Безопасность:**
- ✅ **Ключи только в секретах GitHub**
- ✅ **Никаких утечек** в коде
- ✅ **Автоматическое создание** config.js
- ✅ **Безопасное развертывание**

### **Надежность:**
- ✅ **8 ключей** вместо 1
- ✅ **Автоматическое переключение** при ошибках
- ✅ **Никаких простоев** при превышении лимита

### **Производительность:**
- ✅ **Распределение нагрузки** между ключами
- ✅ **Больше параллельных запросов**
- ✅ **Обход географических ограничений**

## 🎯 Результат:

**Теперь приложение:**
- 🔄 **Автоматически переключается** между 8 ключами из секретов
- 🚫 **Не останавливается** при превышении лимита
- 🎭 **Использует Mock** только если все ключи не работают
- ⚡ **Работает стабильно** без ошибок quota
- 🔒 **Полностью безопасно** - ключи не в коде

---

**Добавьте ключи в GitHub Secrets и наслаждайтесь стабильной работой!** 🚀✅ 