
import React from 'react';
import { Event } from '../types';
import { CalendarIcon } from './Icons';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const formattedDate = new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 hover:shadow-indigo-500/30">
      <div className="p-6">
        <h3 className="text-xl font-bold text-indigo-400 mb-2">{event.eventName}</h3>
        <p className="text-slate-300 mb-4 text-sm">{event.description}</p>
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
