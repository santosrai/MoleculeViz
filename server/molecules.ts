import { type InsertMolecule } from "@shared/schema";

export const predefinedMolecules: InsertMolecule[] = [
  {
    name: "water",
    formula: "H2O",
    structure: {
      atoms: [
        { x: 0, y: 0, z: 0, color: 0xff0000 },  // Oxygen (red)
        { x: -0.8, y: 0.6, z: 0, color: 0xffffff },  // Hydrogen 1 (white)
        { x: 0.8, y: 0.6, z: 0, color: 0xffffff },   // Hydrogen 2 (white)
      ],
      bonds: [
        { x: -0.4, y: 0.3, z: 0, rx: 0.8, ry: 0, rz: 0 },  // O-H bond 1
        { x: 0.4, y: 0.3, z: 0, rx: -0.8, ry: 0, rz: 0 },  // O-H bond 2
      ]
    }
  },
  {
    name: "methane",
    formula: "CH4",
    structure: {
      atoms: [
        { x: 0, y: 0, z: 0, color: 0x808080 },  // Carbon (gray)
        { x: 1, y: 1, z: 1, color: 0xffffff },   // Hydrogen 1
        { x: -1, y: -1, z: 1, color: 0xffffff }, // Hydrogen 2
        { x: 1, y: -1, z: -1, color: 0xffffff }, // Hydrogen 3
        { x: -1, y: 1, z: -1, color: 0xffffff }  // Hydrogen 4
      ],
      bonds: [
        { x: 0.5, y: 0.5, z: 0.5, rx: 0.7, ry: 0.7, rz: 0.7 },    // C-H bond 1
        { x: -0.5, y: -0.5, z: 0.5, rx: -0.7, ry: -0.7, rz: 0.7 }, // C-H bond 2
        { x: 0.5, y: -0.5, z: -0.5, rx: 0.7, ry: -0.7, rz: -0.7 }, // C-H bond 3
        { x: -0.5, y: 0.5, z: -0.5, rx: -0.7, ry: 0.7, rz: -0.7 }  // C-H bond 4
      ]
    }
  }
];
