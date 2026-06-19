const http = require('http');

console.log('Sending request to API Gateway...');
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/services?officeId=00000000-0000-0000-0000-000000000001',
  method: 'GET',
  headers: {
    'x-user-role': 'subsystem_admin'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error('Connection Error:', e);
});

req.end();
