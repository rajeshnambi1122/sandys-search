const http = require('http');

const data = JSON.stringify({
    query: 'pan'
});

const options = {
    hostname: 'localhost',
    port: 5002,
    path: '/api/search',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(body);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
