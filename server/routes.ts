import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertMoleculeSchema, insertChatSchema } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/molecules", async (req, res) => {
    try {
      const data = insertMoleculeSchema.parse(req.body);
      const molecule = await storage.createMolecule(data);
      res.json(molecule);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Invalid request" });
    }
  });

  app.get("/api/molecules/:id", async (req, res) => {
    const molecule = await storage.getMolecule(parseInt(req.params.id));
    if (!molecule) {
      res.status(404).json({ error: "Molecule not found" });
      return;
    }
    res.json(molecule);
  });

  app.get("/api/molecules/name/:name", async (req, res) => {
    const molecule = await storage.getMoleculeByName(req.params.name);
    if (!molecule) {
      res.status(404).json({ error: "Molecule not found" });
      return;
    }
    res.json(molecule);
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { question, moleculeId } = req.body;

      // Get molecule information to provide context
      const molecule = await storage.getMolecule(moleculeId);
      if (!molecule) {
        throw new Error("Molecule not found");
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a chemistry expert. You are discussing the molecule ${molecule.name} (${molecule.formula}). Its molecular structure consists of ${molecule.structure.atoms.length} atoms and ${molecule.structure.bonds.length} bonds. Answer questions about this molecule and provide answers in JSON format with an 'answer' field.`
          },
          {
            role: "user",
            content: question
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const parsedContent = JSON.parse(content || "{}");
      const answer = parsedContent.answer || "No answer provided";

      const chat = await storage.createChat({
        question,
        answer,
        moleculeId
      });

      res.json(chat);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Internal server error" });
    }
  });

  app.get("/api/chat/:moleculeId", async (req, res) => {
    const chats = await storage.getChatsForMolecule(parseInt(req.params.moleculeId));
    res.json(chats);
  });

  const httpServer = createServer(app);
  return httpServer;
}