
import { Event } from '../types';

// Helper to format date and time for iCalendar standard (UTC)
const formatIcsDateTime = (dateStr: string, timeStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create a date object assuming local time, then get UTC components
  const date = new Date(year, month - 1, day, hours, minutes);
  
  const pad = (num: number) => num.toString().padStart(2, '0');

  const yearUTC = date.getUTCFullYear();
  const monthUTC = pad(date.getUTCMonth() + 1);
  const dayUTC = pad(date.getUTCDate());
  const hoursUTC = pad(date.getUTCHours());
  const minutesUTC = pad(date.getUTCMinutes());

  return `${yearUTC}${monthUTC}${dayUTC}T${hoursUTC}${minutesUTC}00Z`;
};

export const generateIcsContent = (events: Event[]): string => {
  const calendarEvents = events.map(event => {
    const uid = `${event.date}-${event.eventName.replace(/[^a-zA-Z0-9]/g, "")}@aieventscraper.com`;
    const dtstamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

    const dtstart = formatIcsDateTime(event.date, event.time);
    
    // Assume a 2-hour duration for events if no end time is provided
    const startDate = new Date(dtstart);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const dtend = endDate.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

    return `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${event.eventName}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location.replace(/\n/g, '\\n')}
END:VEVENT
    `.trim();
  }).join('\n');

  return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AIEventScraper//EN
${calendarEvents}
END:VCALENDAR
  `.trim();
};
