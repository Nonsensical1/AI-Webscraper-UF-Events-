
import React, { useState, useCallback } from 'react';
import { Event, GroundingChunk } from './types';
import { findEvents } from './services/geminiService';
import { generateIcsContent } from './services/icsService';
import EventCard from './components/EventCard';
import LoadingSpinner from './components/LoadingSpinner';
import { DownloadIcon, SearchIcon, LinkIcon } from './components/Icons';

const App: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState<string>('University of Florida');
  const [topics, setTopics] = useState<string>('Concerts, biotech conferences, and seminars in biology and engineering.');
  
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const handleFindEvents = useCallback(async () => {
    if (!location.trim() || !topics.trim()) {
        setError("Please provide both a university/location and topics to search for.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setEvents([]);
    setSources([]);
    try {
      const { events: foundEvents, sources: foundSources } = await findEvents(location, topics, selectedMonth, selectedYear);
      setEvents(foundEvents);
      setSources(foundSources);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [location, topics, selectedMonth, selectedYear]);

  const handleDownloadIcs = () => {
    if (events.length === 0) return;
    const icsContent = generateIcsContent(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events_${selectedMonth}_${selectedYear}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const uniqueSources = sources.reduce<GroundingChunk[]>((acc, current) => {
    const uri = current.web?.uri || current.maps?.uri;
    if (uri && !acc.some(item => (item.web?.uri || item.maps?.uri) === uri)) {
        acc.push(current);
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Universal AI Event Finder
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl mx-auto">
            Describe a university or location and your topics of interest. The AI will find relevant events and generate a calendar file for you.
          </p>
        </header>

        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl shadow-slate-900/50 mb-10 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-1">University / Location</label>
                <input 
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Stanford University"
                    className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="topics" className="block text-sm font-medium text-slate-300 mb-1">Topics</label>
                <textarea 
                    id="topics"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="e.g., Art exhibitions, tech meetups, jazz concerts"
                    rows={2}
                    className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {monthNames.map(month => <option key={month} value={month}>{month}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-700 border-slate-600 text-white rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <div className="mt-4">
             <button
              onClick={handleFindEvents}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-md transition-all duration-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              <SearchIcon className="w-5 h-5" />
              {isLoading ? 'Searching...' : 'Find Events'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center my-6">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <EventCard key={`${event.eventName}-${index}`} event={event} />
              ))}
            </div>
            
            {uniqueSources.length > 0 && (
                <div className="mt-12 p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <h4 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2"><LinkIcon className="w-5 h-5" /> Sources</h4>
                    <ul className="text-xs text-indigo-400 space-y-2">
                        {uniqueSources.map((source, index) => (
                            <li key={index}>
                                <a href={source.web?.uri || source.maps?.uri} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">
                                    {source.web?.title || source.maps?.title || source.web?.uri || source.maps?.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="text-center mt-12">
              <button
                onClick={handleDownloadIcs}
                className="flex items-center justify-center gap-2 mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300"
              >
                <DownloadIcon className="w-5 h-5" />
                Download .ics Calendar
              </button>
            </div>
          </>
        ) : !error && (
            <div className="text-center py-16 px-6 bg-slate-800 rounded-xl border border-dashed border-slate-700">
                <h2 className="text-2xl font-semibold text-slate-300">Welcome!</h2>
                <p className="mt-2 text-slate-400">Enter a university or location and your topics of interest, then click "Find Events" to get started.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;