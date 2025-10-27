import React from 'react';
import { Event } from '../types';
import { CalendarIcon } from './Icons';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    let formattedDate: string;

    try {
        // The 'T00:00:00' helps ensure the date is parsed in the local timezone, not UTC.
        const dateObj = new Date(`${event.date}T00:00:00`);
        // Check if the date is valid after creation
        if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid date value from API');
        }
        formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch (e) {
        // If the date format from the API is unexpected, display it as is to prevent a crash.
        formattedDate = event.date;
        console.warn("Could not parse date:", event.date);
    }

    const getCategoryColor = (category: string) => {
        switch (category?.toLowerCase()) {
            case 'concert':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'conference':
                return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
            case 'seminar':
            case 'lecture':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            default:
                return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 hover:shadow-indigo-500/30 flex flex-col">
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-indigo-400 pr-2">{event.eventName}</h3>
            {event.category && (
                <span className={`inline-block whitespace-nowrap shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getCategoryColor(event.category)}`}>
                    {event.category}
                </span>
            )}
        </div>
        <p className="text-slate-300 mb-4 text-sm flex-grow">{event.description}</p>
        <div className="flex flex-col space-y-3 text-xs text-slate-400">
            <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-indigo-400" />
                <span>{formattedDate} at {event.time}</span>
            </div>
            <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
