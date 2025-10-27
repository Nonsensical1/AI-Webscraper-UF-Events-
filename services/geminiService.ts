import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Event, GroundingChunk } from '../types';

export const findEvents = async (month: string, year: number): Promise<{ events: Event[]; sources: GroundingChunk[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Act as an expert event curator. Find events happening in ${month} ${year} in Gainesville, Florida. Your search should include:
    1. Concerts of any genre.
    2. Reputable academic and industry conferences in the fields of biotechnology, biomedicine, protein engineering, genetic engineering, and molecular biology.
    3. Music recitals at the University of Florida (UF).
    4. Academic events (seminars, talks, workshops) at the University of Florida (UF) from departments related to the scientific fields mentioned above.

    For each event you find, provide the event name, a concise one-sentence description, the date in YYYY-MM-DD format, the start time in HH:MM (24-hour) format, and the location. 
    
    Please return the result *only* as a JSON array of objects that conforms to this TypeScript interface:
    interface Event {
      eventName: string;
      description: string;
      date: string; // YYYY-MM-DD
      time: string; // HH:MM
      location: string;
    }
    
    Do not include any other text, commentary, or markdown formatting. If no events are found, return an empty array: [].
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text.trim();
    let events: Event[] = [];
    if (text) {
        try {
            // The model might return the JSON wrapped in markdown, let's extract it.
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            let jsonString = text;
            if (jsonMatch && jsonMatch[1]) {
                jsonString = jsonMatch[1];
            }

            // Find the start and end of the array to robustly parse it
            const startIndex = jsonString.indexOf('[');
            const endIndex = jsonString.lastIndexOf(']');

            if (startIndex === -1 || endIndex === -1) {
                throw new Error("No valid JSON array found in the response.");
            }
            
            jsonString = jsonString.substring(startIndex, endIndex + 1);

            events = JSON.parse(jsonString);

        } catch(e) {
            console.error("Failed to parse JSON response:", text, e);
            throw new Error("Received an invalid or malformed JSON response from the AI.");
        }
    }
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { events, sources };
  } catch (error) {
    console.error("Error fetching events from Gemini API:", error);
    // Re-throw parsing errors to be displayed to the user.
    if (error instanceof Error && error.message.startsWith("Received an invalid")) {
      throw error;
    }
    // For other errors, throw a generic message.
    throw new Error("Failed to fetch events. Please check your API key and network connection.");
  }
};
