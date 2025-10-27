import { Event } from '../types';

// Helper to format a Date object for iCalendar standard (UTC)
const formatDateToIcs = (date: Date): string => {
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

    // Create the start date object from event data, with robust parsing.
    const [year, month, day] = (event.date || '').split('-').map(Number);
    const [hours, minutes] = (event.time || '00:00').split(':').map(Number);

    // Check if parts are valid numbers before creating a Date.
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
        console.warn(`Skipping event with invalid date/time parts: ${event.eventName}`);
        return ''; // Skip this event if date/time is invalid
    }

    const startDate = new Date(year, month - 1, day, hours, minutes);

    // Check if the created date is valid
    if (isNaN(startDate.getTime())) {
        console.warn(`Skipping event due to invalid Date object: ${event.eventName}`);
        return ''; // Skip invalid date
    }

    // Assume a 2-hour duration for events
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const dtstart = formatDateToIcs(startDate);
    const dtend = formatDateToIcs(endDate);

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
  }).filter(Boolean).join('\n'); // Filter out empty strings from skipped events

  return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AIEventScraper//EN
${calendarEvents}
END:VCALENDAR
  `.trim();
};
