import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://ems_user:ems_pass@127.0.0.1:5433/ems_db'
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database on port 5433.');

    // 1. Update user names
    console.log('Updating user names for teacher choices...');
    await client.query(`
      UPDATE users SET name = 'Dingdong Dantes', email = 'ddantes_teacher@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000001';
      UPDATE users SET name = 'Joshua Garcia', email = 'jgarcia_teacher@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000002';
      UPDATE users SET name = 'Mika Salamanca', email = 'msalamanca_teacher@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000003';

      UPDATE users SET name = 'Dingdong Dantes (Acad)', email = 'ddantes_teacher_acad@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000004';
      UPDATE users SET name = 'Joshua Garcia (Acad)', email = 'jgarcia_teacher_acad@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000005';
      UPDATE users SET name = 'Mika Salamanca (Acad)', email = 'msalamanca_teacher_acad@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000006';

      UPDATE users SET name = 'Dingdong Dantes (OSAS)', email = 'ddantes_teacher_osas@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000007';
      UPDATE users SET name = 'Joshua Garcia (OSAS)', email = 'jgarcia_teacher_osas@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000008';
      UPDATE users SET name = 'Mika Salamanca (OSAS)', email = 'msalamanca_teacher_osas@pup.edu.ph' WHERE id = '22000000-0000-0000-0000-000000000009';
    `);
    console.log('User names updated successfully.');

    // 2. Drop audit triggers to prevent double insertions
    console.log('Dropping audit log database triggers to prevent duplicate history records...');
    await client.query(`
      DROP TRIGGER IF EXISTS trg_status_history ON transactions;
      DROP TRIGGER IF EXISTS trg_history_on_create ON transactions;
    `);
    console.log('Database triggers dropped successfully.');

    // 3. Clear existing double logs (optional, but clean for existing transactions)
    // Keep only the rich action_type entries (e.g. action_type != 'STATUS_CHANGE' or older if both status change, or simply let seen deduplication handle old logs)
    // Let's delete the trigger-generated 'STATUS_CHANGE' logs where 'action_type' is the default and it duplicates 'CREATE'
    console.log('Cleaning up duplicate status logs...');
    await client.query(`
      DELETE FROM transaction_status_history h1
      WHERE h1.action_type = 'STATUS_CHANGE' 
        AND EXISTS (
          SELECT 1 FROM transaction_status_history h2 
          WHERE h2.transaction_id = h1.transaction_id 
            AND h2.action_type = 'CREATE'
            AND h2.id != h1.id
        );
    `);
    console.log('Cleanup completed successfully.');

  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await client.end();
  }
}

main();
