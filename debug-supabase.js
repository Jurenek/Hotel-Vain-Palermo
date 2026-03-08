
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Testing with URL:', url);

    if (!url || !key) {
        console.error('Missing env variables');
        return;
    }

    const supabase = createClient(url, key);

    console.log('Testing connection to "requests" table...');
    const { data, error } = await supabase.from('requests').select('*').limit(1);

    if (error) {
        console.error('Error querying "requests":', error);
    } else {
        console.log('Success! Found', data.length, 'rows.');
    }

    console.log('Testing connection to "hotel_settings" table...');
    const res2 = await supabase.from('hotel_settings').select('*').limit(1);
    if (res2.error) {
        console.error('Error querying "hotel_settings":', res2.error);
    } else {
        console.log('Success! Found', res2.data.length, 'rows.');
    }
}

test();
