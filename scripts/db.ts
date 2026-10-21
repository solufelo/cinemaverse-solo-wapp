// Database maintenance. Uses DATABASE_URL when set, otherwise the embedded dev database in .data/pglite.
//   node scripts/db.ts migrate        apply pending migrations
//   node scripts/db.ts seed           add the demo community if it isn't there yet
//   node scripts/db.ts reseed         re-time the demo community to "now" (deletes and re-inserts demo players)
//   node scripts/db.ts reset          embedded DB only: wipe everything, migrate and seed
import { rmSync } from 'node:fs'
import { createDbFromEnv } from '../server/db/index.ts'
import { migrate } from '../server/db/migrate.ts'
import { seedDemo } from '../server/db/seed.ts'

const cmd = process.argv[2]
const env: NodeJS.ProcessEnv = { ...process.env, CINEMAVERSE_DEV: process.env.CINEMAVERSE_DEV ?? '1' }

if (cmd === 'reset') {
  if (env.DATABASE_URL?.startsWith('postgres')) {
    console.error('Refusing to reset a DATABASE_URL database. Drop it yourself if you mean it.')
    process.exit(1)
  }
  rmSync(env.PGLITE_DIR || '.data/pglite', { recursive: true, force: true })
}

const db = createDbFromEnv(env)
try {
  await migrate(db)
  console.log(`migrated (${db.kind})`)
  if (cmd === 'seed' || cmd === 'reset') console.log(await seedDemo(db))
  if (cmd === 'reseed') {
    await db.query("delete from users where kind = 'demo'")
    console.log(await seedDemo(db))
  }
  if (!['migrate', 'seed', 'reseed', 'reset'].includes(cmd ?? '')) {
    console.error('Usage: node scripts/db.ts <migrate|seed|reseed|reset>')
    process.exitCode = 1
  }
} finally {
  await db.close()
}
