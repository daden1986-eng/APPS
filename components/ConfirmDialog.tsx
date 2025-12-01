import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-labelledby="confirm-dialog-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 dark:bg-black/70"
            onClick={onClose}
            aria-hidden="true"
          ></motion.div>

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md m-4 overflow-hidden"
          >
            <div className="p-6">
              <h2 id="confirm-dialog-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-bold bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2.5 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;