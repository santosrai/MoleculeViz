import { type Molecule, type InsertMolecule, type Chat, type InsertChat } from "@shared/schema";
import { predefinedMolecules } from "./molecules";

export interface IStorage {
  getMolecule(id: number): Promise<Molecule | undefined>;
  getMoleculeByName(name: string): Promise<Molecule | undefined>;
  createMolecule(molecule: InsertMolecule): Promise<Molecule>;
  createChat(chat: InsertChat): Promise<Chat>;
  getChatsForMolecule(moleculeId: number): Promise<Chat[]>;
}

export class MemStorage implements IStorage {
  private molecules: Map<number, Molecule>;
  private chats: Map<number, Chat>;
  private currentMoleculeId: number;
  private currentChatId: number;

  constructor() {
    this.molecules = new Map();
    this.chats = new Map();
    this.currentMoleculeId = 1;
    this.currentChatId = 1;

    // Initialize with predefined molecules
    predefinedMolecules.forEach(molecule => {
      this.createMolecule(molecule);
    });
  }

  async getMolecule(id: number): Promise<Molecule | undefined> {
    return this.molecules.get(id);
  }

  async getMoleculeByName(name: string): Promise<Molecule | undefined> {
    return Array.from(this.molecules.values()).find(
      (molecule) => molecule.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createMolecule(insertMolecule: InsertMolecule): Promise<Molecule> {
    const id = this.currentMoleculeId++;
    const molecule: Molecule = { ...insertMolecule, id };
    this.molecules.set(id, molecule);
    return molecule;
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentChatId++;
    if (!insertChat.moleculeId) {
      throw new Error("moleculeId is required");
    }
    const chat: Chat = {
      id,
      question: insertChat.question,
      answer: insertChat.answer,
      moleculeId: insertChat.moleculeId
    };
    this.chats.set(id, chat);
    return chat;
  }

  async getChatsForMolecule(moleculeId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      (chat) => chat.moleculeId === moleculeId
    );
  }
}

export const storage = new MemStorage();