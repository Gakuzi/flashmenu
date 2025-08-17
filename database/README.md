# 🗄️ GitHub Database для Flash Menu

## 📁 Структура базы данных

```
database/
├── users/
│   ├── user_1.json
│   ├── user_2.json
│   └── index.json
├── menus/
│   ├── menu_1.json
│   ├── menu_2.json
│   └── index.json
└── README.md
```

## 🔐 Система пользователей

### **users/index.json** - Реестр пользователей
```json
{
  "users": [
    {
      "id": "user_1",
      "email": "user@example.com",
      "passwordHash": "hashed_password",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "lastLogin": "2024-01-01T15:00:00.000Z"
    }
  ]
}
```

### **users/user_1.json** - Данные конкретного пользователя
```json
{
  "id": "user_1",
  "email": "user@example.com",
  "availableIngredients": ["рис", "макароны"],
  "menus": ["menu_1", "menu_2"],
  "currentProducts": [],
  "boughtProducts": [],
  "lastUpdated": "2024-01-01T15:00:00.000Z"
}
```

## 🍽️ Система меню

### **menus/index.json** - Реестр меню
```json
{
  "menus": [
    {
      "id": "menu_1",
      "userId": "user_1",
      "budget": 1500,
      "days": 7,
      "meal": "Все",
      "totalCost": 1250.50,
      "createdAt": "2024-01-01T14:00:00.000Z"
    }
  ]
}
```

### **menus/menu_1.json** - Детали конкретного меню
```json
{
  "id": "menu_1",
  "userId": "user_1",
  "budget": 1500,
  "days": 7,
  "meal": "Все",
  "start": "Сегодня с ужина",
  "items": [
    {
      "day": "День 1",
      "meal": "Завтрак",
      "recipe": "Овсянка с яблоками...",
      "ingredients": [
        {
          "name": "Овсяные хлопья",
          "qty": 100,
          "unit": "г"
        }
      ],
      "cookingTime": 10
    }
  ],
  "totalCost": 1250.50,
  "createdAt": "2024-01-01T14:00:00.000Z"
}
```

## 🔄 API для работы с данными

### **GitHub API endpoints:**
- `GET /repos/{owner}/{repo}/contents/database/users/index.json`
- `PUT /repos/{owner}/{repo}/contents/database/users/user_{id}.json`
- `GET /repos/{owner}/{repo}/contents/database/menus/index.json`
- `PUT /repos/{owner}/{repo}/contents/database/menus/menu_{id}.json`

## 🛡️ Безопасность

- Пароли хешируются (bcrypt)
- GitHub токен для доступа к API
- Валидация данных на клиенте и сервере
- Rate limiting для API запросов

## 📊 Преимущества

✅ **Бесплатно** - GitHub бесплатен  
✅ **Версионирование** - история изменений  
✅ **Доступность** - данные всегда доступны  
✅ **Безопасность** - GitHub защищает данные  
✅ **Синхронизация** - между устройствами  

## ⚠️ Ограничения

❌ **Размер файлов** - максимум 100MB  
❌ **API лимиты** - 5000 запросов/час  
❌ **Задержки** - не мгновенно  
❌ **Офлайн режим** - требует интернет  

## 🚀 Использование

1. Создайте GitHub токен
2. Настройте репозиторий
3. Инициализируйте структуру БД
4. Интегрируйте с приложением 