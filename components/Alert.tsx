import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from './icons/Icons';

interface AlertProps {
  message: string;
  onDismiss: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-r-lg flex items-center justify-between shadow" role="alert">
      <div className="flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 mr-3 text-amber-500" />
        <p className="font-bold">{message}</p>
      </div>
      <button onClick={onDismiss} title="Dispensar alerta" className="p-1 rounded-full text-amber-500 hover:bg-amber-200" aria-label="Dispensar alerta">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Alert;