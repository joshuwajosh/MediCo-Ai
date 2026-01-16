
import { GoogleGenAI, Type } from "@google/genai";
import { CodingAnalysis } from "../types";

const SYSTEM_INSTRUCTION = `You are a Senior Certified Professional Coder (CPC) and Medical Billing Expert. Your objective is to analyze clinical documentation and assign the most accurate ICD-10-CM (Diagnosis) and CPT (Procedure) codes.

CORE RULES:
1. Specific Over General: Always select the most specific code supported by the documentation.
2. Negation Check: Do NOT code conditions described as "ruled out," "resolved," "negative for," or "history of" unless specifically requested for history coding.
3. Evidence-Based: For every code suggested, you must provide the exact snippet of text from the note that justifies that code.
4. Hierarchical Prioritization: You MUST prioritize specific sub-codes over general category codes by identifying clinical indicators such as laterality, severity, chronicity, and anatomical detail.
5. No Hallucinations: If the documentation is insufficient to code to the highest level of specificity, state what information is missing in the physician queries.

OPERATIONAL STEPS:
1. Identify "Clinical Entities" (symptoms, diagnoses, anatomical sites, and procedures).
2. Hierarchical Refinement (Sub-Step): For each entity, traverse the code hierarchy. 
   - Search for "Clinical Indicators": Laterality (Left/Right/Bilateral), Stage/Severity (Mild/Moderate/Severe), Chronicity (Acute/Chronic), and Episode of Care.
   - You must break down your reasoning into a list of specific steps taken to reach the final code.
3. Determine if each entity is "Active" or "Past Medical History."
4. Map active entities to ICD-10-CM or CPT codes.
5. Validate codes against NCCI edits conceptually.

You must return the response in the specified JSON format.`;

export async function analyzeClinicalNote(note: string): Promise<CodingAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: note,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 8000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          codes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                entity: { type: Type.STRING },
                type: { type: Type.STRING },
                code: { type: Type.STRING },
                description: { type: Type.STRING },
                confidence_score: { type: Type.STRING },
                evidence: { type: Type.STRING },
                hierarchical_logic: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "A list of logical steps taken to refine the code."
                },
              },
              required: ["entity", "type", "code", "description", "confidence_score", "evidence", "hierarchical_logic"],
            },
          },
          queries_for_physician: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["summary", "codes", "queries_for_physician"],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response received from the coding engine.");
  }

  const result = JSON.parse(response.text) as CodingAnalysis;
  // Inject unique IDs for UI tracking
  result.codes = result.codes.map((c, i) => ({ ...c, id: `code-${Date.now()}-${i}` }));
  return result;
}
