import React, { useState } from 'react';
import { Appointment } from '../types';
import { XMarkIcon, PlusIcon, BellAlertIcon, TrashIcon, CalendarDaysIcon } from './icons/Icons';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onDeleteAppointment: (id: string) => void;
}

const AgendaModal: React.FC<AgendaModalProps> = ({ isOpen, onClose, appointments, onAddAppointment, onDeleteAppointment }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) return;
    onAddAppointment({ title, date, time, notes, type: 'manual' });
    setTitle('');
    setNotes('');
  };

  // FIX: Explicitly type the initial value for the reduce function to ensure correct type inference.
  const groupedAppointments = appointments.reduce((acc: Record<string, Appointment[]>, app) => {
    const date = app.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarDaysIcon className="h-6 w-6 text-indigo-500" />
            Agenda &amp; Lembretes
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Fechar" aria-label="Fechar modal">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        <main className="flex-grow grid grid-cols-1 md:grid-cols-3 overflow-hidden">
            {/* Form Section */}
            <div className="md:col-span-1 p-6 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Novo Compromisso</h3>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Título</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm" required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Data</label>
                            <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm" required />
                        </div>
                         <div>
                            <label htmlFor="time" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Hora</label>
                            <input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm" required />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Notas</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm"></textarea>
                    </div>
                    <button type="submit" title="Adicionar compromisso" className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-indigo-700">
                        <PlusIcon className="h-5 w-5" /> Adicionar
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="md:col-span-2 p-6 overflow-y-auto">
                <div className="space-y-6">
                    {Object.keys(groupedAppointments).length > 0 ? Object.entries(groupedAppointments).map(([groupDate, apps]) => (
                        <div key={groupDate}>
                            <h3 className="text-md font-semibold text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-700">
                                {new Date(groupDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <ul className="mt-3 space-y-3">
                                {/* FIX: Add Array.isArray check to satisfy TypeScript compiler and prevent runtime errors. */}
                                {Array.isArray(apps) && apps.map(app => (
                                    <li key={app.id} className="flex items-start gap-3">
                                        <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${app.type === 'reminder' ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-indigo-100 dark:bg-indigo-900/50'}`}>
                                            {app.type === 'reminder' 
                                                ? <BellAlertIcon className="h-5 w-5 text-amber-500" /> 
                                                : <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                                            }
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">{app.title}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{app.time}</p>
                                                </div>
                                                <button onClick={() => onDeleteAppointment(app.id)} title="Excluir compromisso" className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500" aria-label="Excluir compromisso">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                            {app.notes && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">{app.notes}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )) : (
                        <div className="text-center py-10">
                            <CalendarDaysIcon className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
                            <p className="mt-2 text-slate-500 dark:text-slate-400">Nenhum compromisso agendado.</p>
                            <p className="text-sm text-slate-400">Adicione um novo compromisso ou crie uma compra parcelada para ver os lembretes aqui.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default AgendaModal;