// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const entries = sqliteTable('entries', { id: text('id').primaryKey(), owner: text('owner').notNull(), data: text('data').notNull(), updated: text('updated').notNull() });
