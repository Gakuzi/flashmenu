// Supabase Client для Flash Menu
// Бесплатная PostgreSQL база данных

class SupabaseClient {
    constructor(url, anonKey) {
        this.url = url;
        this.anonKey = anonKey;
        this.supabase = null;
        this.initialized = false;
    }

    // Инициализация Supabase
    async init() {
        try {
            // Динамически загружаем Supabase JS клиент
            if (!window.supabase) {
                await this.loadSupabaseScript();
            }

            // Создаем клиент
            this.supabase = window.supabase.createClient(this.url, this.anonKey);
            
            // Проверяем подключение
            const { data, error } = await this.supabase.from('users').select('count').limit(1);
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = таблица не существует
                throw error;
            }

            this.initialized = true;
            console.log('✅ Supabase подключен успешно');
            return true;
        } catch (error) {
            console.error('❌ Ошибка подключения к Supabase:', error);
            return false;
        }
    }

    // Загрузка Supabase JS библиотеки
    async loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Не удалось загрузить Supabase'));
            document.head.appendChild(script);
        });
    }

    // Создание таблиц (если не существуют)
    async createTables() {
        if (!this.initialized) return false;

        try {
            // Создаем таблицу пользователей
            const { error: usersError } = await this.supabase.rpc('create_users_table');
            if (usersError) console.warn('Таблица users уже существует');

            // Создаем таблицу меню
            const { error: menusError } = await this.supabase.rpc('create_menus_table');
            if (menusError) console.warn('Таблица menus уже существует');

            // Создаем таблицу продуктов
            const { error: productsError } = await this.supabase.rpc('create_products_table');
            if (productsError) console.warn('Таблица products уже существует');

            console.log('✅ Таблицы проверены/созданы');
            return true;
        } catch (error) {
            console.error('Ошибка создания таблиц:', error);
            return false;
        }
    }

    // === ПОЛЬЗОВАТЕЛИ ===

    // Регистрация пользователя
    async registerUser(email, password) {
        if (!this.initialized) throw new Error('Supabase не инициализирован');

        try {
            // Создаем пользователя в auth
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: email,
                password: password
            });

            if (authError) throw authError;

            // Создаем профиль пользователя
            const { error: profileError } = await this.supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    email: email,
                    available_ingredients: ['рис (~700 г)', 'макароны', 'капуста', 'масло', 'соль', 'специи'],
                    created_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            console.log('✅ Пользователь зарегистрирован:', authData.user.id);
            return authData.user;
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            throw error;
        }
    }

    // Вход пользователя
    async loginUser(email, password) {
        if (!this.initialized) throw new Error('Supabase не инициализирован');

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            console.log('✅ Пользователь вошел:', data.user.id);
            return data.user;
        } catch (error) {
            console.error('Ошибка входа:', error);
            throw error;
        }
    }

    // Выход пользователя
    async logoutUser() {
        if (!this.initialized) return;

        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            console.log('✅ Пользователь вышел');
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    }

    // Получить текущего пользователя
    async getCurrentUser() {
        if (!this.initialized) return null;

        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            return null;
        }
    }

    // === ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ===

    // Получить данные пользователя
    async getUserData(userId) {
        if (!this.initialized) return null;

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            return null;
        }
    }

    // Обновить данные пользователя
    async updateUserData(userId, data) {
        if (!this.initialized) return false;

        try {
            const { error } = await this.supabase
                .from('users')
                .update({
                    ...data,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            console.log('✅ Данные пользователя обновлены');
            return true;
        } catch (error) {
            console.error('Ошибка обновления данных пользователя:', error);
            return false;
        }
    }

    // === МЕНЮ ===

    // Сохранить меню
    async saveMenu(menu) {
        if (!this.initialized) return false;

        try {
            const { error } = await this.supabase
                .from('menus')
                .upsert({
                    id: menu.id,
                    user_id: menu.userId,
                    budget: menu.budget,
                    days: menu.days,
                    meal: menu.meal,
                    start: menu.start,
                    items: menu.items,
                    total_cost: menu.totalCost,
                    created_at: menu.createdAt || new Date().toISOString()
                });

            if (error) throw error;

            console.log('✅ Меню сохранено:', menu.id);
            return true;
        } catch (error) {
            console.error('Ошибка сохранения меню:', error);
            return false;
        }
    }

    // Получить меню пользователя
    async getUserMenus(userId) {
        if (!this.initialized) return [];

        try {
            const { data, error } = await this.supabase
                .from('menus')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Ошибка получения меню:', error);
            return [];
        }
    }

    // Получить конкретное меню
    async getMenu(menuId) {
        if (!this.initialized) return null;

        try {
            const { data, error } = await this.supabase
                .from('menus')
                .select('*')
                .eq('id', menuId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Ошибка получения меню:', error);
            return null;
        }
    }

    // Удалить меню
    async deleteMenu(menuId) {
        if (!this.initialized) return false;

        try {
            const { error } = await this.supabase
                .from('menus')
                .delete()
                .eq('id', menuId);

            if (error) throw error;

            console.log('✅ Меню удалено:', menuId);
            return true;
        } catch (error) {
            console.error('Ошибка удаления меню:', error);
            return false;
        }
    }

    // === ПРОДУКТЫ ===

    // Сохранить список продуктов
    async saveProducts(userId, products) {
        if (!this.initialized) return false;

        try {
            const { error } = await this.supabase
                .from('products')
                .upsert({
                    user_id: userId,
                    products: products,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            console.log('✅ Продукты сохранены');
            return true;
        } catch (error) {
            console.error('Ошибка сохранения продуктов:', error);
            return false;
        }
    }

    // Получить список продуктов пользователя
    async getUserProducts(userId) {
        if (!this.initialized) return [];

        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('products')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data?.products || [];
        } catch (error) {
            console.error('Ошибка получения продуктов:', error);
            return [];
        }
    }

    // === СИНХРОНИЗАЦИЯ ===

    // Синхронизировать все данные пользователя
    async syncUserData(userId, localData) {
        if (!this.initialized) return false;

        try {
            // Обновляем профиль пользователя
            await this.updateUserData(userId, {
                available_ingredients: localData.availableIngredients || [],
                menus: localData.menus || []
            });

            // Сохраняем продукты
            await this.saveProducts(userId, localData.currentProducts || []);

            console.log('✅ Данные синхронизированы');
            return true;
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
            return false;
        }
    }

    // Загрузить все данные пользователя
    async loadUserData(userId) {
        if (!this.initialized) return null;

        try {
            const [userData, menus, products] = await Promise.all([
                this.getUserData(userId),
                this.getUserMenus(userId),
                this.getUserProducts(userId)
            ]);

            return {
                availableIngredients: userData?.available_ingredients || [],
                menus: menus || [],
                currentProducts: products || [],
                boughtProducts: [] // Пока не реализовано
            };
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            return null;
        }
    }

    // === СТАТУС ===

    // Проверить статус подключения
    async checkConnection() {
        if (!this.initialized) return false;

        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);

            return !error;
        } catch (error) {
            return false;
        }
    }

    // Получить статистику
    async getStats() {
        if (!this.initialized) return null;

        try {
            const [usersCount, menusCount] = await Promise.all([
                this.supabase.from('users').select('count'),
                this.supabase.from('menus').select('count')
            ]);

            return {
                users: usersCount.count || 0,
                menus: menusCount.count || 0
            };
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return null;
        }
    }
}

// Экспорт для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseClient;
} else {
    window.SupabaseClient = SupabaseClient;
} 