
// Consolidated Gemini API service for technical analysis, appraisals, and academic summaries.
import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult, MarketplaceItem, HonestReview } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Result structure for technical 360-degree video audits
export interface VideoInspectionResult {
  item_name: string;
  category: string;
  quality_grade: 'A' | 'B' | 'C';
  estimated_price: number;
  review: HonestReview;
  carbonSaved: number;
}

export interface AIDetectionResult {
  item_name: string;
  category: string;
  confidence_score: number;
  quality_grade: 'A' | 'B' | 'C';
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  description: string;
  estimated_price: number;
}

// Technical audit for engineering tools using a 360-degree video scan
export const analyze360Video = async (base64Video: string, mimeType: string = 'video/mp4'): Promise<VideoInspectionResult> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Video,
            },
          },
          {
            text: `Perform a 'Visual Technical Appraisal' for the engineering asset shown in this 360-degree rotation video for UniShare (BVDUCOEP student marketplace).
            
            Audit Steps:
            1. Identify the tool/hardware precisely.
            2. Technical Inspection: Look closely for physical flaws across all angles (scratches, rust, bent pins, cracks, wear, or missing components).
            3. Grading: 
               - 'A': Mint condition, no visible faults.
               - 'B': Good/Used, minor cosmetic wear.
               - 'C': Functional but has significant physical flaws or heavy wear.
            4. Fair Appraisal: Estimate value in INR for a second-hand student sale.
            5. Sustainability: Estimate Carbon Saved (kg) by re-using this tool.

            Return ONLY a JSON object with this schema:
            {
              "item_name": "string",
              "category": "Engineering Graphics Kits" | "Drawing Sheet Containers" | "Vehicle Sensors" | "Hardware/Tools" | "Electronic Components",
              "quality_grade": "A" | "B" | "C",
              "estimated_price": number,
              "carbonSaved": number,
              "review": {
                "specs": ["string", "string"],
                "faults": ["string", "string"],
                "grading_explanation": "string"
              }
            }
            
            Crucial: If the video does not clearly show an engineering asset, set item_name to "None".`
          }
        ],
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || '{}');
    if (result.item_name === "None" || !result.item_name) {
       throw new Error("No engineering tool detected in scan.");
    }
    return result as VideoInspectionResult;
  } catch (e: any) {
    console.error("Gemini Video Analysis Error:", e);
    throw new Error(e.message || "Appraisal failed. Ensure the tool is centered and well-lit.");
  }
};

export const explainJWTClaims = async (decodedPayload: any): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are a cybersecurity and web development professor at BVDUCOEP. 
    Explain these JWT claims to a student in a helpful, educational way. 
    Point out any sensitive info and explain what standard claims like 'iat', 'sub', and 'iss' mean.
    Decoded Payload: ${JSON.stringify(decodedPayload)}`
  });
  return response.text;
};

export const detectObjectAndAppraise = async (base64Image: string): Promise<AIDetectionResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `You are a technical appraisal agent for UniShare. Identify the engineering tool.
          Return a JSON object with: item_name, category, quality_grade ('A'|'B'|'C'), box_2d, description, estimated_price.`
        }
      ],
    },
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    return JSON.parse(response.text || '{}') as AIDetectionResult;
  } catch (e) {
    console.error("Gemini Detection Error:", e);
    throw new Error("Failed to parse AI detection results.");
  }
};

export const analyzeToolDamage = async (base64Image: string): Promise<ScanResult> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `Inspect for structural damage. Assign Grade A, B, or C.
          Respond ONLY with a JSON object.`
        }
      ],
    },
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text) as ScanResult;
  } catch (e) {
    console.error("Gemini Parse Error:", e);
    return {
      toolName: "Unknown Tool",
      qualityGrade: 'B',
      condition: 'Good',
      score: 7,
      findings: ["Manual inspection required."],
      recommendation: "Verify manually."
    };
  }
};

export const generateListingDetails = async (base64Image: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: "Examine this image for a student engineering marketplace. Respond in JSON." }
      ]
    },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};

export const summarizeNote = async (title: string, dept: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Summarize key concepts for ${title}.`
  });
  return response.text;
};

export const generateSmartSummaryFromPdf = async (base64Pdf: string, title: string) => {
  const ai = getAI();
  const base64Data = base64Pdf.includes(',') ? base64Pdf.split(',')[1] : base64Pdf;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data
          }
        },
        {
          text: `Provide a 3-bullet summary for ${title}.`
        }
      ]
    }
  });
  
  return response.text;
};

export const getHandoverZones = async (lat: number, lng: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `List handover spots near BVDUCOEP.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    }
  });
  
  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const getSupportResponse = async (query: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Support query: ${query}`
  });
  return response.text;
};

export const compareMarketplaceItems = async (item1: MarketplaceItem, item2: MarketplaceItem) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Compare ${item1.title} and ${item2.title}.`
  });
  return response.text;
};
