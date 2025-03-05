import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const molecules = pgTable("molecules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  formula: text("formula").notNull(),
  structure: jsonb("structure").notNull(),
});

export const insertMoleculeSchema = createInsertSchema(molecules).pick({
  name: true,
  formula: true,
  structure: true,
});

export type InsertMolecule = z.infer<typeof insertMoleculeSchema>;
export type Molecule = typeof molecules.$inferSelect;

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  moleculeId: serial("molecule_id").references(() => molecules.id),
});

export const insertChatSchema = createInsertSchema(chats).pick({
  question: true,
  answer: true,
  moleculeId: true,
});

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;
