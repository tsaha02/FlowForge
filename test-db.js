const { Client } = require('pg');

const connectionString = "postgresql://postgres.lctvepnrafrgxclxicis:FlowFOrge1234@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=disable";

async function test() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log("Connecting to Supabase...");
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

test();
