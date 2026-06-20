const { Client } = require('pg');

async function main() {
  const connectionString = 'postgresql://ems_user:ems_pass@127.0.0.1:5433/ems_db';
  console.log('Testing connection to:', connectionString);
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connection successful!');
    
    const res = await client.query('SELECT current_database(), current_user');
    console.log('Connected DB info:', res.rows[0]);

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tables.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

main();
