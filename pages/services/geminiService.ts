
import { GoogleGenAI, Type } from "@google/genai";
import { ScanResult, MarketplaceItem, HonestReview } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface VideoInspectionResult {
  item_name: string;
  category: string;
  quality_grade: 'A' | 'B' | 'C';
  estimated_price: number;
  review: HonestReview;
  carbonSaved: number;
}

export const analyze360Video = async (base64Video: string, mimeType: string = 'video/mp4'): Promise<VideoInspectionResult> => {
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
          text: `You are the "Honest Inspector" for UniShare, a student marketplace at BVDUCOEP.
          Analyze this 360-degree video scan of an object. This could be an engineering tool, an electronic gadget, a textbook, or any general student essential.
          
          Perform a technical audit:
          1. Identify the object accurately (e.g., "Logitech Mouse", "Mini-Drafter", "Physics Textbook", "Apple iPhone 13").
          2. Technical Inspection: Look closely for physical flaws across all angles (scratches, rust, cracks, wear, or missing parts).
          3. Grading: 
             - 'A': Mint/New condition.
             - 'B': Used/Good, minor cosmetic wear.
             - 'C': Functional but heavily used or damaged.
          4. Suggest a fair second-hand student price in INR.
          5. Sustainability: Estimate Carbon Saved (kg) by re-using this item instead of buying new.

          Return ONLY a JSON object with this schema:
          {
            "item_name": "string",
            "category": "Engineering Graphics Kits" | "Drawing Sheet Containers" | "Vehicle Sensors" | "Hardware/Tools" | "Electronic Components" | "General Student Essentials",
            "quality_grade": "A" | "B" | "C",
            "estimated_price": number,
            "carbonSaved": number,
            "review": {
              "specs": ["string", "string"],
              "faults": ["string", "string"],
              "grading_explanation": "string"
            }
          }
          
          If the video is empty or completely unrecognizable, set item_name to "Unidentified Object".`
        }
      ],
    },
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    const result = JSON.parse(response.text || '{}') as VideoInspectionResult;
    if (!result.item_name || result.item_name === "Unidentified Object") {
      throw new Error("Could not clearly identify the object. Please try scanning again with better lighting.");
    }
    return result;
  } catch (e: any) {
    console.error("Gemini Video Analysis Error:", e);
    throw new Error(e.message || "Inspector analysis failed. Please ensure the video is clear.");
  }
};

export const detectObjectAndAppraise = async (base64Image: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: `Identify this object for a student marketplace. Return JSON with item_name, category, quality_grade, description, estimated_price.` }
      ],
    },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
};

export const generateListingDetails = async (base64Image: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: "Examine this image for a student marketplace. Respond in JSON with: 'isIdentifyable' (boolean), 'title', 'price' (INR), 'description', 'category', and 'carbonSaved'. If the image is nonsense, set 'isIdentifyable' to false." }
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
    contents: `Summarize key concepts for ${title} at ${dept} department.`
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
