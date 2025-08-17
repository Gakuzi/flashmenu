# 🌐 Настройка GitHub Pages для Flash Menu

## 📍 Текущее состояние

### Ветки:
- **`main`** - основная ветка (обновлена)
- **`development`** - ветка разработки (обновлена)
- **`gh-pages`** - ветка для GitHub Pages (будет создана автоматически)

### Последние обновления:
- ✅ Все исправления отправлены на GitHub
- ✅ Создан GitHub Actions workflow
- ✅ Готов к настройке GitHub Pages

## 🚀 Настройка GitHub Pages

### 1. Перейдите в настройки репозитория
1. Откройте [https://github.com/Gakuzi/flashmenu](https://github.com/Gakuzi/flashmenu)
2. Нажмите **Settings** (вкладка с шестеренкой)
3. В левом меню выберите **Pages**

### 2. Настройте источник
1. В разделе **Source** выберите **Deploy from a branch**
2. В поле **Branch** выберите **gh-pages** (если есть) или **main**
3. В поле **Folder** оставьте **/(root)**
4. Нажмите **Save**

### 3. Настройте GitHub Actions
1. В левом меню выберите **Actions**
2. Убедитесь, что workflow **Deploy to GitHub Pages** активен
3. При следующем push в `main` ветку автоматически создастся `gh-pages`

### 4. Добавьте секреты (опционально)
1. В левом меню выберите **Secrets and variables** → **Actions**
2. Добавьте секреты:
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = your-anon-key
   GEMINI_API_KEY = your-gemini-key
   ```

## 🔄 Автоматический деплой

### Как это работает:
1. **При push в `main` ветку** → автоматически запускается GitHub Actions
2. **Создается `config.js`** из секретов (если настроены)
3. **Деплой на GitHub Pages** → создается ветка `gh-pages`
4. **Приложение доступно** по адресу: `https://gakuzi.github.io/flashmenu`

### Проверка деплоя:
1. Перейдите в **Actions** → **Deploy to GitHub Pages**
2. Убедитесь, что последний workflow завершился успешно
3. В **Settings** → **Pages** должен появиться URL

## 🌐 URL приложения

После настройки ваше приложение будет доступно по адресу:
```
https://gakuzi.github.io/flashmenu
```

## ❌ Если страница не обновляется

### Возможные причины:
1. **GitHub Actions не запустился** - проверьте вкладку Actions
2. **Ошибка в workflow** - проверьте логи выполнения
3. **Неправильная настройка Pages** - проверьте Source в Settings
4. **Кэш браузера** - попробуйте Ctrl+F5 или очистить кэш

### Решение:
1. **Принудительно запустите workflow:**
   - Перейдите в Actions
   - Нажмите **Run workflow**
   - Выберите ветку `main`

2. **Проверьте настройки Pages:**
   - Source должен быть **Deploy from a branch**
   - Branch должен быть **gh-pages** или **main**

3. **Подождите несколько минут:**
   - GitHub Pages может обновляться с задержкой
   - Проверьте статус в Settings → Pages

## 🔧 Ручной деплой

Если автоматический деплой не работает:

### 1. Создайте ветку gh-pages:
```bash
git checkout -b gh-pages
git push origin gh-pages
```

### 2. Настройте Pages на gh-pages ветку:
- Settings → Pages → Source: **Deploy from a branch**
- Branch: **gh-pages**
- Folder: **/(root)**

### 3. Обновляйте вручную:
```bash
git checkout gh-pages
git merge main
git push origin gh-pages
```

## 📊 Проверка работы

### 1. Откройте приложение:
- `https://gakuzi.github.io/flashmenu`

### 2. Проверьте функционал:
- ✅ Авторизация работает
- ✅ Генерация меню работает
- ✅ Mock API работает
- ✅ Все вкладки отображаются

### 3. Проверьте консоль:
- Откройте F12 → Console
- Должны быть сообщения о загрузке

## 🎯 Итоговый результат

После правильной настройки:
- ✅ **GitHub Pages активен** и обновляется автоматически
- ✅ **Приложение доступно** по публичному URL
- ✅ **Все исправления** работают в продакшене
- ✅ **Mock API** обеспечивает стабильную работу
- ✅ **Авторизация** работает через localStorage

## 📞 Поддержка

Если проблемы не решаются:
1. Проверьте **Actions** на наличие ошибок
2. Проверьте **Settings** → **Pages** на правильность настроек
3. Создайте **Issue** в репозитории с описанием проблемы
4. Проверьте **Network** вкладку браузера на ошибки загрузки 