import { type InsertMolecule } from "@shared/schema";

export const predefinedMolecules: InsertMolecule[] = [
  {
    name: "water",
    formula: "H2O",
    structure: {
      atoms: [
        { id: 1, x: 0, y: 0, z: 0, color: 0xff0000 },  // Oxygen (red)
        { id: 2, x: -0.8, y: 0.6, z: 0, color: 0xffffff },  // Hydrogen 1 (white)
        { id: 3, x: 0.8, y: 0.6, z: 0, color: 0xffffff },   // Hydrogen 2 (white)
      ],
      bonds: [
        { atomIds: [1, 2] },  // O-H bond 1
        { atomIds: [1, 3] },  // O-H bond 2
      ]
    }
  },
  {
    name: "methane",
    formula: "CH4",
    structure: {
      atoms: [
        { id: 1, x: 0, y: 0, z: 0, color: 0x808080 },  // Carbon (gray)
        { id: 2, x: 1, y: 1, z: 1, color: 0xffffff },   // Hydrogen 1
        { id: 3, x: -1, y: -1, z: 1, color: 0xffffff }, // Hydrogen 2
        { id: 4, x: 1, y: -1, z: -1, color: 0xffffff }, // Hydrogen 3
        { id: 5, x: -1, y: 1, z: -1, color: 0xffffff }  // Hydrogen 4
      ],
      bonds: [
        { atomIds: [1, 2] },    // C-H bond 1
        { atomIds: [1, 3] },    // C-H bond 2
        { atomIds: [1, 4] },    // C-H bond 3
        { atomIds: [1, 5] }     // C-H bond 4
      ]
    }
  }
];