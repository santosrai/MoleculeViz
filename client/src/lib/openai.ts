import { apiRequest } from "./queryClient";

export async function askAboutMolecule(question: string, moleculeId: number) {
  const response = await apiRequest("POST", "/api/chat", {
    question,
    moleculeId,
  });
  return response.json();
}
