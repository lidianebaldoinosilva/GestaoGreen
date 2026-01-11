
import { GoogleGenAI } from "@google/genai";
import { Batch, Partner, Material } from "../types";

export const getInventoryInsights = async (batches: Batch[], partners: Partner[], materials: Material[]) => {
  // Use process.env.API_KEY directly for initialization as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const stockSummary = batches.map(b => {
    const p = partners.find(p => p.id === b.partnerId);
    const m = materials.find(m => m.code === b.materialCode);
    return `Lote ${b.id}: ${m?.name || 'Material'} de ${p?.name || 'Parceiro'}, ${b.weightKg}kg, Status: ${b.status}`;
  }).join("\n");

  const prompt = `
    Você é um analista especialista em reciclagem de plásticos para a empresa "Green".
    Abaixo está o resumo do nosso estoque atual (PEBD e PP):
    ${stockSummary}

    Com base nesses dados, forneça uma análise curta (máximo 3 parágrafos) sobre:
    1. Qual material temos mais em estoque (sujo vs acabado).
    2. Sugestão de prioridade de produção baseada no volume.
    3. Alerta se houver algum parceiro com muitos lotes parados.
    Responda em Português.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Correctly using .text property (not a method) as per guidelines.
    return response.text;
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Não foi possível gerar insights no momento.";
  }
};
