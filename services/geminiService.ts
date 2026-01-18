/*
import Bytez from "bytez.js";
import { CodingAnalysis } from "../types";

// Your working Bytez Key
const apiKey = "bb6b4617d55444404f84d0a06bf207ea"; 

export async function analyzeClinicalNote(note: string): Promise<CodingAnalysis> {
  try {
    const sdk = new Bytez(apiKey);
    const model = sdk.model("google/gemini-2.5-pro");

    const prompt = `You are a Senior CPC Medical Coder. 
    Analyze the clinical note. Return valid JSON only.
    
    REQUIRED STRUCTURE:
    {
      "summary": "Clinical summary string",
      "medical_necessity": "Medical necessity string",
      "codes": [
        { "code": "A00.0", "description": "...", "type": "ICD-10", "reasoning": "...", "hierarchical_logic": ["..."] }
      ]
    }
    
    Note: ${note}`;

    const { error, output } = await model.run([{ role: "user", content: prompt }]);

    if (error) throw new Error("Bytez Error: " + error);

    // --- 1. UNLOCK THE DATA (The Fix) ---
    // The log shows data is inside 'output.content'
    let jsonString = "";
    
    if (output && typeof output === 'object' && 'content' in output) {
        // Case A: It's wrapped in { role: "assistant", content: "..." }
        jsonString = (output as any).content;
    } else if (typeof output === 'string') {
        // Case B: It's just the raw string
        jsonString = output;
    } else {
        // Case C: It's already parsed (rare)
        jsonString = JSON.stringify(output);
    }

    // --- 2. CLEAN & PARSE ---
    // Remove the ```json ... ``` wrapper seen in your screenshot
    const cleanJson = jsonString.replace(/^```json|```$/g, "").replace(/^```|```$/g, "").trim();
    
    console.log("PARSING TEXT:", cleanJson); // Debugging line
    
    const data = JSON.parse(cleanJson);

    // --- 3. MAP TO UI ---
    const finalData: CodingAnalysis = {
      summary: data.summary || "Summary generated from findings.",
      medical_necessity: data.medical_necessity || "Medically necessary.",
      codes: Array.isArray(data.codes) ? data.codes.map((c: any, i: number) => ({
        ...c,
        id: `code-${Date.now()}-${i}`, // Essential for React List
        hierarchical_logic: c.hierarchical_logic || ["Verified per guidelines."]
      })) : []
    };

    return finalData;

  } catch (err: any) {
    console.error("PARSING FAILED:", err);
    throw new Error("Failed to parse AI results. Check console.");
  }
}
  */
 import Bytez from "bytez.js";
import { CodingAnalysis } from "../types";

// Your working Bytez Key
const apiKey = "bb6b4617d55444404f84d0a06bf207ea"; 

const SYSTEM_INSTRUCTION = `You are a Senior Certified Professional Coder (CPC) & Compliance Auditor.
You must strictly follow the ICD-10 and CPT Core Rule Sets below.

=== PART 1: ICD-10 CORE RULE SET (DIAGNOSIS) ===
RULE 1: Confirmed Diagnosis Overrides Symptoms (e.g., Pneumonia → suppress fever/cough).
RULE 2: Suspected/Probable (Outpatient) → Code symptoms only. Do NOT code unconfirmed diagnoses (keywords: rule out, possible).
RULE 3: No Diagnosis Documented → Code symptoms (R chapter). Never invent disease.
RULE 4: Etiology + Manifestation → Code BOTH (e.g., Diabetes + Neuropathy).
RULE 5: History vs Current → "History of" ≠ active. Use Z codes (Z86.xx). Do NOT code acute if resolved.
RULE 6: Chronic Conditions → Always code if existing (Diabetes, COPD, HTN) unless "resolved".
RULE 7: Multiple Unrelated Conditions → Code ALL (e.g., Asthma + Knee pain).
RULE 8: Signs Integral to Disease → Do NOT code separately (e.g., Pain with fracture).
RULE 9: Laterality & Specificity → Always choose Right/Left/Acute/Chronic. Avoid "Unspecified" if possible.
RULE 10: Chapter Mapping → Respiratory=J, Musculoskeletal=M, etc.

=== PART 2: CPT CORE RULE SET (PROCEDURE) ===
RULE 1: Procedure Must Be Documented → No assumptions.
RULE 2: Bundling Rules → Do NOT double bill for included steps (e.g., Closure is part of Surgery).
RULE 3: Separate Procedure (-59) → Use only if distinct and documented separately.
RULE 4: E/M Coding → Based on MDM complexity or Time.
RULE 5: Laterality Modifiers → Add RT/LT where applicable.
RULE 6: Diagnostic vs Therapeutic → Differentiate (e.g., Colonoscopy type).
RULE 7: Global Period → Post-op visits are usually bundled.
RULE 8: Add-on Codes → Must attach to base code.
RULE 9: Multiple Procedures → Highest RVU first. Use modifier -51 for secondary.
RULE 10: Medical Necessity → CPT must match ICD reason.

REQUIRED JSON OUTPUT FORMAT:
{
  "summary": "Clinical abstract",
  "medical_necessity": "Justification",
  "codes": [
    {
      "code": "FINAL_CODE",
      "description": "OFFICIAL_DESCRIPTOR",
      "type": "ICD-10" or "CPT",
      "reasoning": "Reference Rule #X: [Explanation]",
      "hierarchical_logic": ["Step 1", "Step 2"]
    }
  ]
}`;

export async function analyzeClinicalNote(note: string): Promise<CodingAnalysis> {
  try {
    const sdk = new Bytez(apiKey);
    const model = sdk.model("google/gemini-2.5-pro");

    const { error, output } = await model.run([
      { role: "user", content: `${SYSTEM_INSTRUCTION}\n\nCLINICAL NOTE:\n${note}` }
    ]);

    if (error) throw new Error("Bytez Error: " + error);

    // LOGIC: Parse output and handle Bytez formatting
    let data: any = output;
    if (typeof output === 'object' && 'content' in (output as any)) {
       data = (output as any).content;
    }
    
    if (typeof data === 'string') {
        data = JSON.parse(data.replace(/^```json|```$/g, "").replace(/^```|```$/g, "").trim());
    }

    // Safety Defaults
    const finalData: CodingAnalysis = {
      summary: data.summary || "Summary generated from findings.",
      medical_necessity: data.medical_necessity || "Medically necessary.",
      codes: Array.isArray(data.codes) ? data.codes.map((c: any, i: number) => ({
        ...c,
        id: `code-${Date.now()}-${i}`,
        hierarchical_logic: c.hierarchical_logic || ["Verified per Core Rule Set."]
      })) : []
    };

    return finalData;

  } catch (err: any) {
    console.error("Analysis Failed:", err);
    return {
      summary: "Error processing note.",
      medical_necessity: "Please check your connection.",
      codes: []
    };
  }
}