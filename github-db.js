// GitHub Database Client для Flash Menu
// Использует GitHub API для хранения данных в JSON файлах

class GitHubDB {
    constructor(owner, repo, token) {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.baseUrl = 'https://api.github.com';
        this.headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }

    // Получить содержимое файла
    async getFile(path) {
        try {
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
                headers: this.headers
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Файл не существует
                }
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            return JSON.parse(atob(data.content));
        } catch (error) {
            console.error('Ошибка получения файла:', error);
            return null;
        }
    }

    // Создать или обновить файл
    async putFile(path, content, message = 'Update data') {
        try {
            // Сначала получаем текущий файл для получения SHA
            const currentFile = await this.getFile(path);
            let sha = null;

            if (currentFile) {
                // Получаем SHA текущего файла
                const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
                    headers: this.headers
                });
                if (response.ok) {
                    const data = await response.json();
                    sha = data.sha;
                }
            }

            const body = {
                message: message,
                content: btoa(JSON.stringify(content, null, 2)),
                branch: 'main'
            };

            if (sha) {
                body.sha = sha;
            }

            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Ошибка сохранения файла:', error);
            return false;
        }
    }

    // Получить список пользователей
    async getUsers() {
        const data = await this.getFile('database/users/index.json');
        return data ? data.users : [];
    }

    // Создать или обновить пользователя
    async saveUser(user) {
        // Обновляем реестр пользователей
        const usersIndex = await this.getFile('database/users/index.json') || { users: [] };
        const existingUserIndex = usersIndex.users.findIndex(u => u.id === user.id);
        
        if (existingUserIndex >= 0) {
            usersIndex.users[existingUserIndex] = {
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                createdAt: user.createdAt,
                lastLogin: new Date().toISOString()
            };
        } else {
            usersIndex.users.push({
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                createdAt: user.createdAt,
                lastLogin: new Date().toISOString()
            });
        }

        usersIndex.lastUpdated = new Date().toISOString();

        // Сохраняем обновленный реестр
        await this.putFile('database/users/index.json', usersIndex, `Update users index`);

        // Сохраняем данные пользователя
        const userData = {
            id: user.id,
            email: user.email,
            availableIngredients: user.availableIngredients || [],
            menus: user.menus || [],
            currentProducts: user.currentProducts || [],
            boughtProducts: user.boughtProducts || [],
            lastUpdated: new Date().toISOString()
        };

        return await this.putFile(`database/users/${user.id}.json`, userData, `Update user ${user.id}`);
    }

    // Получить данные пользователя
    async getUser(userId) {
        return await this.getFile(`database/users/${userId}.json`);
    }

    // Получить список меню
    async getMenus() {
        const data = await this.getFile('database/menus/index.json');
        return data ? data.menus : [];
    }

    // Сохранить меню
    async saveMenu(menu) {
        // Обновляем реестр меню
        const menusIndex = await this.getFile('database/menus/index.json') || { menus: [] };
        const existingMenuIndex = menusIndex.menus.findIndex(m => m.id === menu.id);
        
        if (existingMenuIndex >= 0) {
            menusIndex.menus[existingMenuIndex] = {
                id: menu.id,
                userId: menu.userId,
                budget: menu.budget,
                days: menu.days,
                meal: menu.meal,
                totalCost: menu.totalCost,
                createdAt: menu.createdAt
            };
        } else {
            menusIndex.menus.push({
                id: menu.id,
                userId: menu.userId,
                budget: menu.budget,
                days: menu.days,
                meal: menu.meal,
                totalCost: menu.totalCost,
                createdAt: menu.createdAt
            });
        }

        menusIndex.lastUpdated = new Date().toISOString();

        // Сохраняем обновленный реестр
        await this.putFile('database/menus/index.json', menusIndex, `Update menus index`);

        // Сохраняем детали меню
        return await this.putFile(`database/menus/${menu.id}.json`, menu, `Update menu ${menu.id}`);
    }

    // Получить меню
    async getMenu(menuId) {
        return await this.getFile(`database/menus/${menuId}.json`);
    }

    // Обновить данные пользователя
    async updateUserData(userId, data) {
        const user = await this.getUser(userId);
        if (!user) return false;

        const updatedUser = { ...user, ...data, lastUpdated: new Date().toISOString() };
        return await this.putFile(`database/users/${userId}.json`, updatedUser, `Update user data ${userId}`);
    }

    // Удалить пользователя
    async deleteUser(userId) {
        try {
            // Получаем SHA файла
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/database/users/${userId}.json`, {
                headers: this.headers
            });

            if (!response.ok) return false;

            const data = await response.json();
            const sha = data.sha;

            // Удаляем файл пользователя
            const deleteResponse = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/database/users/${userId}.json`, {
                method: 'DELETE',
                headers: this.headers,
                body: JSON.stringify({
                    message: `Delete user ${userId}`,
                    sha: sha,
                    branch: 'main'
                })
            });

            if (!deleteResponse.ok) return false;

            // Удаляем из реестра пользователей
            const usersIndex = await this.getFile('database/users/index.json');
            if (usersIndex) {
                usersIndex.users = usersIndex.users.filter(u => u.id !== userId);
                usersIndex.lastUpdated = new Date().toISOString();
                await this.putFile('database/users/index.json', usersIndex, `Remove user ${userId}`);
            }

            return true;
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            return false;
        }
    }

    // Проверить подключение
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}`, {
                headers: this.headers
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubDB;
} else {
    window.GitHubDB = GitHubDB;
} 