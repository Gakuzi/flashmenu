// config.example.js - Пример конфигурации для разработки
// Скопируйте этот файл в config.js и заполните своими данными

window.SUPABASE_CONFIG = {
    // Данные из Supabase Dashboard → Settings → API
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here'
};

window.GEMINI_CONFIG = {
    // Ваш API ключ Gemini
    apiKey: 'your-gemini-api-key-here',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

console.log('⚠️ Это пример конфигурации. Создайте config.js с реальными данными!'); 