import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://ems_user:ems_pass@127.0.0.1:5433/ems_db'
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database on port 5433.');

    // 1. Add override columns
    console.log('Adding override columns to transactions table...');
    await client.query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS is_overridden BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS override_reason TEXT,
        ADD COLUMN IF NOT EXISTS override_document_name VARCHAR(500),
        ADD COLUMN IF NOT EXISTS original_time_in TIMESTAMPTZ;
    `);
    console.log('Columns added successfully.');

    // 2. Add comments
    await client.query(`
      COMMENT ON COLUMN transactions.is_overridden IS 'True if the time_in of the transaction has been manually overridden';
      COMMENT ON COLUMN transactions.override_reason IS 'The administrative justification reason for overriding the time_in';
      COMMENT ON COLUMN transactions.override_document_name IS 'The filename of the supporting document uploaded to validate the override';
      COMMENT ON COLUMN transactions.original_time_in IS 'The original automatically-recorded time_in of the transaction';
    `);
    console.log('Comments added successfully.');

    // 3. Seed teachers
    console.log('Seeding teachers into users table...');
    await client.query(`
      INSERT INTO users (id, name, email, role, office_id) VALUES
      ('22000000-0000-0000-0000-000000000001', 'Prof. Juan Dela Cruz', 'jdelacruz_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
      ('22000000-0000-0000-0000-000000000002', 'Prof. Maria Clara', 'mclara_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
      ('22000000-0000-0000-0000-000000000003', 'Prof. Crisostomo Ibarra', 'cibarra_teacher@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000001'),
      ('22000000-0000-0000-0000-000000000004', 'Prof. Juan Dela Cruz (Acad)', 'jdelacruz_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
      ('22000000-0000-0000-0000-000000000005', 'Prof. Maria Clara (Acad)', 'mclara_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
      ('22000000-0000-0000-0000-000000000006', 'Prof. Crisostomo Ibarra (Acad)', 'cibarra_teacher_acad@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000002'),
      ('22000000-0000-0000-0000-000000000007', 'Prof. Juan Dela Cruz (OSAS)', 'jdelacruz_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003'),
      ('22000000-0000-0000-0000-000000000008', 'Prof. Maria Clara (OSAS)', 'mclara_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003'),
      ('22000000-0000-0000-0000-000000000009', 'Prof. Crisostomo Ibarra (OSAS)', 'cibarra_teacher_osas@pup.edu.ph', 'staff', '00000000-0000-0000-0000-000000000003')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Teachers seeded successfully.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

main();
