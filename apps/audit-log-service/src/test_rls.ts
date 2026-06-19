import { Pool } from 'pg'
import { setRlsContext } from './database/database.module'

const pool = new Pool({
  connectionString: 'postgresql://ems_user:ems_pass@127.0.0.1:5433/ems_db'
})

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await setRlsContext(client, {
      'x-office-id': '00000000-0000-0000-0000-000000000001',
      'x-user-role': 'subsystem_admin',
      'x-user-id': '11000000-0000-0000-0000-000000000001'
    })
    console.log('setRlsContext succeeded!')
    await client.query('COMMIT')
  } catch (err) {
    console.error('Error executing setRlsContext:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
