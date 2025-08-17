-- Supabase Setup для Flash Menu
-- Выполните эти команды в SQL Editor вашего проекта Supabase

-- 1. Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    available_ingredients TEXT[] DEFAULT ARRAY['рис (~700 г)', 'макароны', 'капуста', 'масло', 'соль', 'специи'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создание таблицы меню
CREATE TABLE IF NOT EXISTS menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    days INTEGER NOT NULL,
    meal TEXT NOT NULL,
    start TEXT NOT NULL,
    items JSONB NOT NULL,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создание таблицы продуктов
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    products JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_menus_user_id ON menus(user_id);
CREATE INDEX IF NOT EXISTS idx_menus_created_at ON menus(created_at);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- 5. Создание RLS (Row Level Security) политик
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Политика для пользователей: пользователь может видеть только свои данные
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Политика для меню: пользователь может видеть только свои меню
CREATE POLICY "Users can view own menus" ON menus
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menus" ON menus
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menus" ON menus
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own menus" ON menus
    FOR DELETE USING (auth.uid() = user_id);

-- Политика для продуктов: пользователь может видеть только свои продукты
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Создание функций для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Создание представления для статистики
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    COUNT(m.id) as menus_count,
    COALESCE(SUM(m.total_cost), 0) as total_spent,
    u.created_at
FROM users u
LEFT JOIN menus m ON u.id = m.user_id
GROUP BY u.id, u.email, u.created_at;

-- 8. Создание функции для получения данных пользователя
CREATE OR REPLACE FUNCTION get_user_data(user_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    available_ingredients TEXT[],
    menus_count BIGINT,
    total_spent DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.available_ingredients,
        COUNT(m.id),
        COALESCE(SUM(m.total_cost), 0),
        u.created_at
    FROM users u
    LEFT JOIN menus m ON u.id = m.user_id
    WHERE u.id = user_uuid
    GROUP BY u.id, u.email, u.available_ingredients, u.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Создание функции для очистки старых данных (опционально)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Удаляем меню старше указанного количества дней
    DELETE FROM menus 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Создание функции для экспорта данных пользователя
CREATE OR REPLACE FUNCTION export_user_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user', row_to_json(u),
        'menus', COALESCE(json_agg(row_to_json(m)), '[]'::json),
        'products', COALESCE(json_agg(row_to_json(p)), '[]'::json)
    ) INTO result
    FROM users u
    LEFT JOIN menus m ON u.id = m.user_id
    LEFT JOIN products p ON u.id = p.user_id
    WHERE u.id = user_uuid
    GROUP BY u.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Проверка создания таблиц
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'menus', 'products')
ORDER BY table_name;

-- Проверка RLS политик
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 