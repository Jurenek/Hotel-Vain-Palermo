
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env variables
function getEnv() {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
    return env;
}

const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log('--- Checking Supabase Requests ---');
    const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching from Supabase:', error);
        return;
    }

    console.log(`Found ${data.length} recent requests in DB.`);
    data.forEach(r => {
        console.log(`- Request ${r.id}: ${r.status}, ${r.messages.length} messages`);
        if (r.messages.length > 0) {
            console.log(`  Latest: [${r.messages[r.messages.length - 1].sender}] ${r.messages[r.messages.length - 1].text}`);
        }
    });
}

checkDb();
