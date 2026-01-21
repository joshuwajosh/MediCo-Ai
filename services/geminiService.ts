
import { GoogleGenAI, Type } from "@google/genai";
import { CodingAnalysis } from "../types";

const SYSTEM_INSTRUCTION = `You are a certified medical coding CPT assistant.
Analyze clinical notes strictly following these rules:

1. PROCEDURE HIERARCHY: If diagnostic and therapeutic procedures occur in the same session, code ONLY the therapeutic procedure.
2. BUNDLING: If a procedure is bundled into another procedure per NCCI guidelines, do NOT code the bundled procedure.
3. BILATERAL: If the same procedure is performed bilaterally in the same session, apply modifier -50.
4. SEPARATE SESSIONS: If procedures are performed in separate sessions on the same day, apply modifier -59.
5. UNBUNDLED: If multiple procedures are unbundled and performed in the same session, code all applicable CPTs.

Your output must include:
- Reasoning for every included code.
- Reasoning for every excluded code (codes that were considered but rejected due to bundling or hierarchy).
- Detailed modifier application explanation.

Use gemini-3-flash-preview for maximum speed. Response MUST be strict JSON.`;

export async function analyzeClinicalNote(note: string): Promise<CodingAnalysis> {
  try {
    if (!process.env.API_KEY) {
      throw new Error("Missing API Key. Check environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview + thinkingBudget 0 for near-instant response
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: note,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            medical_necessity: { type: Type.STRING },
            codes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["ICD-10", "CPT"] },
                  reasoning: { type: Type.STRING, description: "Why this code is included." },
                  hierarchical_logic: { type: Type.ARRAY, items: { type: Type.STRING } },
                  entity: { type: Type.STRING },
                  confidence_score: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  modifier_applied: { type: Type.STRING },
                  modifier_reasoning: { type: Type.STRING },
                },
                required: ["code", "description", "type", "reasoning", "hierarchical_logic", "entity", "confidence_score", "evidence"],
              },
            },
            excluded_codes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING, description: "Why this code was excluded (bundled/therapeutic overlap/etc)." }
                },
                required: ["code", "description", "reason"]
              }
            },
            queries_for_physician: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["summary", "medical_necessity", "codes", "excluded_codes", "queries_for_physician"],
        },
      },
    });

    if (!response || !response.text) {
      throw new Error("No data returned from the coding engine.");
    }

    const text = response.text.trim();
    const jsonStr = text.startsWith("```") ? text.replace(/```json|```/g, "").trim() : text;
    
    let result: CodingAnalysis;
    try {
      result = JSON.parse(jsonStr) as CodingAnalysis;
    } catch (parseError) {
      console.error("Malformed AI Output:", text);
      throw new Error("The coding logic resulted in a non-standard format. Please retry.");
    }

    // Process result for UI consistency
    result.codes = (result.codes || []).map((c, i) => ({ 
      ...c, 
      id: `code-${Date.now()}-${i}`,
      hierarchical_logic: Array.isArray(c.hierarchical_logic) ? c.hierarchical_logic : []
    }));
    
    return result;

  } catch (err: any) {
    throw new Error(`Audit Engine Error: ${err?.message || "Communication failure"}`);
  }
}
