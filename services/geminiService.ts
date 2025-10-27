import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Event, GroundingChunk } from '../types';

export const findEvents = async (month: string, year: number): Promise<{ events: Event[]; sources: GroundingChunk[] }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Act as an expert event curator performing a comprehensive web search. Find a wide variety of events happening in ${month} ${year} in Gainesville, Florida. Your search should be thorough and include, but is not limited to:
    1. Concerts and live music events of all genres.
    2. Reputable academic and industry conferences, both local and major ones relevant to the area. Focus on fields like biotechnology, biomedicine, life sciences, pharmaceuticals, protein engineering, genetic engineering, bioinformatics, and molecular biology.
    3. Music recitals, plays, and art exhibitions, especially those hosted at the University of Florida (UF) and Santa Fe College.
    4. A wide range of academic events (seminars, guest lectures, symposiums, talks, workshops) at the University of Florida (UF). Specifically search for events from the College of Medicine, College of Pharmacy, Herbert Wertheim College of Engineering (especially Biomedical Engineering), Institute of Food and Agricultural Sciences (IFAS), and the departments of Biology, Chemistry, Biochemistry and Molecular Biology.

    For each event you find, provide the event name, a concise one-sentence description, the date in YYYY-MM-DD format, the start time in HH:MM (24-hour) format, and the specific location (e.g., building and room number if available).
    
    Your goal is to find as many relevant events as possible.
    
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