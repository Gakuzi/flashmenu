# 🚨 Исправление проблемы с GitHub Pages

## ❌ Проблема
```
Ошибка: Действие не выполнено из-за ошибки "Процесс '/usr/bin/git' завершился с кодом выхода 128"
удаленный доступ: github-actions[бот]. отказано в доступе к Gakuzi/flashmenu.git
фатальная ошибка: невозможно получить доступ к 'https://github.com/Gakuzi/flashmenu.git/': запрошенный URL вернул ошибку: 403
```

## ✅ Решение

### 1. **Проверьте настройки репозитория**

#### **Settings → Actions → General:**
- ✅ **Actions permissions**: "Allow all actions and reusable workflows"
- ✅ **Workflow permissions**: "Read and write permissions"
- ✅ **Allow GitHub Actions to create and approve pull requests**: Включено

#### **Settings → Pages:**
- ✅ **Source**: "Deploy from a branch"
- ✅ **Branch**: `gh-pages` (создастся автоматически)
- ✅ **Folder**: `/ (root)`

### 2. **Создайте Personal Access Token (PAT)**

#### **Шаг 1: Создание токена**
1. Перейдите в **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Нажмите **"Generate new token (classic)"**
3. Выберите **"Generate new token (classic)"**

#### **Шаг 2: Настройка прав**
- ✅ **repo** (полный доступ к репозиториям)
- ✅ **workflow** (управление GitHub Actions)
- ✅ **admin:org** (если репозиторий в организации)

#### **Шаг 3: Создание токена**
1. Введите **Note**: `Flash Menu Deploy Token`
2. Выберите **Expiration**: `90 days` (рекомендуется)
3. Нажмите **"Generate token"**
4. **Скопируйте токен** (больше не покажется!)

### 3. **Добавьте токен в Secrets**

#### **Settings → Secrets and variables → Actions:**
1. Нажмите **"New repository secret"**
2. **Name**: `PAT_TOKEN`
3. **Value**: вставьте скопированный токен
4. Нажмите **"Add secret"**

### 4. **Обновите workflow файл**

Замените в `.github/workflows/deploy.yml`:

```yaml
- name: Build and deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  if: github.ref == 'refs/heads/main'
  with:
    github_token: ${{ secrets.PAT_TOKEN }}  # Используем PAT вместо GITHUB_TOKEN
    publish_dir: .
    publish_branch: gh-pages
    force_orphan: true
    user_name: 'github-actions[bot]'
    user_email: 'github-actions[bot]@users.noreply.github.com'
```

### 5. **Альтернативное решение - используйте GITHUB_TOKEN**

Если не хотите создавать PAT, обновите workflow:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write

- name: Build and deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  if: github.ref == 'refs/heads/main'
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: .
    publish_branch: gh-pages
    force_orphan: true
    user_name: 'github-actions[bot]'
    user_email: 'github-actions[bot]@users.noreply.github.com'
```

## 🔧 Проверка настроек

### **1. Проверьте workflow permissions:**
```yaml
permissions:
  contents: read      # Чтение кода
  pages: write        # Запись в GitHub Pages
  id-token: write     # Создание токенов
```

### **2. Проверьте concurrency:**
```yaml
concurrency:
  group: "pages"           # Группа для страниц
  cancel-in-progress: false # Не отменять текущие деплои
```

### **3. Проверьте user info:**
```yaml
user_name: 'github-actions[bot]'
user_email: 'github-actions[bot]@users.noreply.github.com'
```

## 🚀 Тестирование

### **1. Отправьте изменения:**
```bash
git add .github/workflows/deploy.yml
git commit -m "Fix GitHub Pages deployment permissions"
git push origin main
```

### **2. Проверьте Actions:**
- Перейдите в **Actions** вкладку
- Должен запуститься workflow "Deploy to GitHub Pages"
- Проверьте логи на ошибки

### **3. Проверьте Pages:**
- Перейдите в **Settings → Pages**
- Должна появиться ссылка на сайт
- Сайт должен быть доступен по адресу: `https://gakuzi.github.io/flashmenu/`

## 📋 Пошаговая инструкция

### **День 1: Настройка прав**
1. ✅ Проверьте **Settings → Actions → General**
2. ✅ Включите **"Read and write permissions"**
3. ✅ Создайте **Personal Access Token**
4. ✅ Добавьте токен в **Secrets**

### **День 2: Обновление workflow**
1. ✅ Обновите `.github/workflows/deploy.yml`
2. ✅ Добавьте `permissions` и `concurrency`
3. ✅ Используйте правильный токен
4. ✅ Отправьте изменения на GitHub

### **День 3: Тестирование**
1. ✅ Проверьте **Actions** вкладку
2. ✅ Убедитесь, что workflow запустился
3. ✅ Проверьте **Settings → Pages**
4. ✅ Откройте сайт по ссылке

## 🔍 Диагностика проблем

### **Проблема: "Permission denied"**
**Решение:**
- Проверьте **Settings → Actions → General**
- Включите **"Read and write permissions"**
- Создайте **Personal Access Token**

### **Проблема: "Branch not found"**
**Решение:**
- Убедитесь, что ветка `main` существует
- Проверьте, что workflow запускается при push в `main`
- Проверьте **Settings → Pages → Source**

### **Проблема: "Workflow not running"**
**Решение:**
- Проверьте синтаксис YAML файла
- Убедитесь, что файл в `.github/workflows/`
- Проверьте **Settings → Actions → General**

### **Проблема: "Site not accessible"**
**Решение:**
- Подождите 5-10 минут после деплоя
- Проверьте **Settings → Pages** на наличие ошибок
- Убедитесь, что ветка `gh-pages` создалась

## 📊 Ожидаемый результат

После исправления:
- ✅ **GitHub Actions** запускается без ошибок
- ✅ **Деплой** проходит успешно
- ✅ **Ветка gh-pages** создается автоматически
- ✅ **Сайт** доступен по адресу `https://gakuzi.github.io/flashmenu/`
- ✅ **Автоматическое обновление** при каждом push в `main`

## 🆘 Если ничего не помогает

### **1. Проверьте логи GitHub Actions:**
- Откройте **Actions** вкладку
- Нажмите на failed workflow
- Изучите логи на наличие ошибок

### **2. Проверьте настройки репозитория:**
- **Settings → Actions → General**
- **Settings → Pages**
- **Settings → Secrets and variables → Actions**

### **3. Создайте issue:**
- Опишите проблему подробно
- Приложите скриншоты ошибок
- Укажите версию workflow файла

### **4. Альтернативный деплой:**
Можно использовать другие actions:
- `actions/deploy-pages@v4`
- `ad-m/github-push-action@master`
- Ручной деплой через `gh-pages` пакет

## 🎯 Итоговый результат

После исправления всех настроек:
- ✅ **GitHub Pages** работает автоматически
- ✅ **Деплой** происходит при каждом push в `main`
- ✅ **Сайт** обновляется в реальном времени
- ✅ **Все исправления** доступны пользователям
- ✅ **Mock API** работает стабильно

GitHub Pages обеспечивает автоматический деплой вашего приложения! 