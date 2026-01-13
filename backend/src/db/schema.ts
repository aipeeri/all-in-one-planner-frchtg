import { pgTable, text, uuid, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema.js';

// ===== FOLDERS TABLE =====
export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['notes', 'diet'] }).notNull(), // notes or diet
  color: text('color').default('blue'), // customizable color
  icon: text('icon').default('folder'), // customizable icon
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index('folders_user_id_idx').on(table.userId),
  index('folders_type_idx').on(table.type),
]);

// ===== NOTES TABLE =====
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  tags: jsonb('tags').$type<string[]>().default([]), // Array of tags
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index('notes_user_id_idx').on(table.userId),
  index('notes_folder_id_idx').on(table.folderId),
]);

// ===== NOTE MEDIA TABLE =====
export const noteMedia = pgTable('note_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  mediaKey: text('media_key').notNull(), // Storage key from app.storage
  mediaType: text('media_type', { enum: ['image', 'video'] }).notNull(),
  filename: text('filename').notNull(),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('note_media_note_id_idx').on(table.noteId),
  index('note_media_user_id_idx').on(table.userId),
]);

// ===== APPOINTMENTS TABLE =====
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(), // Date and time of appointment
  location: text('location'),
  reminderMinutes: integer('reminder_minutes').default(15), // Minutes before appointment
  reminderEnabled: boolean('reminder_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index('appointments_user_id_idx').on(table.userId),
  index('appointments_date_idx').on(table.date),
]);

// ===== DIET ENTRIES TABLE =====
export const dietEntries = pgTable('diet_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(), // Date of the meal (stored as date)
  mealType: text('meal_type', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
  foodName: text('food_name').notNull(),
  calories: integer('calories'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index('diet_entries_user_id_idx').on(table.userId),
  index('diet_entries_folder_id_idx').on(table.folderId),
  index('diet_entries_date_idx').on(table.date),
]);

// ===== RELATIONS =====
export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
  notes: many(notes),
  dietEntries: many(dietEntries),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
  folder: one(folders, {
    fields: [notes.folderId],
    references: [folders.id],
  }),
  media: many(noteMedia),
}));

export const noteMediaRelations = relations(noteMedia, ({ one }) => ({
  note: one(notes, {
    fields: [noteMedia.noteId],
    references: [notes.id],
  }),
  user: one(user, {
    fields: [noteMedia.userId],
    references: [user.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(user, {
    fields: [appointments.userId],
    references: [user.id],
  }),
}));

export const dietEntriesRelations = relations(dietEntries, ({ one }) => ({
  user: one(user, {
    fields: [dietEntries.userId],
    references: [user.id],
  }),
  folder: one(folders, {
    fields: [dietEntries.folderId],
    references: [folders.id],
  }),
}));
