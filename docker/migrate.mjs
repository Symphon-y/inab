import pg from "pg";
import fs from "fs";
import path from "path";

const migrationsDir = path.join(process.cwd(), "src/db/migrations");
const journalPath = path.join(migrationsDir, "meta/_journal.json");

async function migrate() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query(
      `SELECT hash FROM "__drizzle_migrations"`
    );
    const appliedHashes = new Set(applied.map((r) => r.hash));

    // Read the drizzle journal
    const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));

    for (const entry of journal.entries) {
      if (appliedHashes.has(entry.tag)) {
        console.log(`Skipping already applied: ${entry.tag}`);
        continue;
      }

      const sqlFile = path.join(migrationsDir, `${entry.tag}.sql`);
      const sql = fs.readFileSync(sqlFile, "utf-8");

      console.log(`Applying migration: ${entry.tag}`);
      await client.query(sql);
      await client.query(
        `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
        [entry.tag, entry.when]
      );
      console.log(`Applied: ${entry.tag}`);
    }

    console.log("All migrations applied successfully.");
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
