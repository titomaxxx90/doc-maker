// supabase.js
// Кодировка: UTF-8

const SUPABASE_URL = 'https://lrzrlvmtnxnjytemrudg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KYVX1YsWddI1yDnIK-TqmA_d689-aQH'; // Тот самый длинный ключ

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Doc-Maker: Подключение к базе установлено.");