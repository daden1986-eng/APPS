
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProofViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
}

const ProofViewer: React.FC<ProofViewerProps> = ({ isOpen, onClose, imageSrc }) => {
  return (
    <AnimatePresence>
      {isOpen && imageSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-labelledby="proof-viewer-title"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/75"
            aria-hidden="true"
          ></motion.div>

          {/* Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl p-4"
            onClick={(e) => e.stopPropagation()} // Mencegah dialog tertutup saat mengklik gambar
          >
            <button
                type="button"
                onClick={onClose}
                className="absolute -top-3 -right-3 z-10 bg-white dark:bg-slate-600 rounded-full p-1 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                aria-label="Tutup"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="w-full h-auto max-h-[80vh] overflow-auto">
                 <img src={imageSrc} alt="Bukti Transaksi" className="w-full h-auto rounded" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProofViewer;