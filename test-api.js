
const fetch = require('node-fetch'); // Next.js might not have node-fetch available in dev environment if not installed, but let's try standard fetch if node 18+

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guestId: 'test-guest',
                guestName: 'Tester',
                roomNumber: '101',
                type: 'taxi',
                message: 'Hello World'
            }) // Added missing closing brace
        });

        if (!res.ok) {
            console.error('Error:', res.status, res.statusText);
            const text = await res.text();
            console.error(text);
        } else {
            const data = await res.json();
            console.log('Success:', data);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

test();
