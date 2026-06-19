const http = require('http');

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
  console.error(`problem with request: ${e.message}`);
});

req.end();
