
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) env[key.trim()] = valueParts.join('=').trim();
    });
    return env;
}

const env = getEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check(table) {
    try {
        const { data, count, error } = await supabase.from(table).select('*', { count: 'exact' });
        if (error) return `❌ ${table}: ${error.message}`;
        const firstRow = data && data.length > 0 ? JSON.stringify(data[0], null, 2).substring(0, 100) + '...' : 'empty';
        return `✅ ${table}: ${count} rows found.\nExample: ${firstRow}`;
    } catch (e) {
        return `🌋 ${table}: CRASH - ${e.message}`;
    }
}

async function run() {
    const settings = await check('hotel_settings');
    const experiences = await check('experiences');
    const requests = await check('requests');

    const report = [
        '--- DB REPORT ---',
        settings,
        '-----------------',
        experiences,
        '-----------------',
        requests,
        '--- END REPORT ---'
    ].join('\n\n');

    console.log(report);
    fs.writeFileSync('diag_result.txt', report);
}

run();
