
export interface Event {
  eventName: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  category: string; // e.g., "Concert", "Conference", "Seminar"
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  }
}