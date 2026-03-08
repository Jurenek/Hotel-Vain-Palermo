
// Diagnostic test for chat system (using built-in fetch)
const API_BASE = 'http://localhost:3000/api';

async function testChat() {
    console.log('--- Testing Chat System ---');

    try {
        // 1. Get all requests
        console.log('1. Fetching all requests...');
        const res = await fetch(`${API_BASE}/requests`);
        if (!res.ok) throw new Error(`Failed to fetch requests: ${res.status}`);
        const requests = await res.json();
        console.log(`Found ${requests.length} requests.`);

        let targetId;
        if (requests.length === 0) {
            console.log('No requests found. Creating a test request...');
            const createRes = await fetch(`${API_BASE}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestId: 'test-user',
                    guestName: 'Test User',
                    roomNumber: '101',
                    type: 'taxi',
                    message: 'Hello, I need a taxi.'
                })
            });
            const newReq = await createRes.json();
            console.log('Created request:', newReq.id);
            targetId = newReq.id;
        } else {
            targetId = requests[0].id;
        }

        console.log(`Targeting request: ${targetId}`);

        // 2. Send a message from reception
        console.log('2. Sending message from reception...');
        const patchRes = await fetch(`${API_BASE}/requests/${targetId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello! Your taxi is on the way. (Test Message)',
                status: 'in_progress'
            })
        });

        if (patchRes.ok) {
            const updated = await patchRes.json();
            console.log('Message sent successfully.');
            console.log('Last message:', updated.messages[updated.messages.length - 1]);
        } else {
            console.error('Failed to send message:', await patchRes.text());
        }

        // 3. Verify polling
        console.log('3. Verifying polling data...');
        const pollRes = await fetch(`${API_BASE}/requests?t=${Date.now()}`);
        const pollData = await pollRes.json();
        const found = pollData.find(r => r.id === targetId);
        if (found) {
            console.log(`Polling successful. Request ${targetId} has ${found.messages.length} messages.`);
        } else {
            console.error('Polling failed: Request not found in list.');
        }
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testChat();
