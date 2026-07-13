import React from 'react';

interface ClearChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isClearing?: boolean;
}

export default function ClearChatModal({ isOpen, onClose, onConfirm, isClearing }: ClearChatModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#F5F0DC] text-on-surface border-4 border-on-surface shadow-[8px_8px_0_rgba(0,0,0,1)] rounded-lg p-6 w-full max-w-sm relative rotate-1 text-[#1A1A2E] animate-in zoom-in-95 duration-150">
        <h3 className="font-anton text-2xl uppercase border-b-3 border-on-surface pb-2 mb-4 text-[#bf542e]">
          Clear Chat
        </h3>
        
        <p className="font-archivo-narrow text-lg mb-6 font-bold">
          Clear all chat history? This can't be undone.
        </p>
        
        <div className="flex gap-4 justify-end mt-4">
          <button
            onClick={onClose}
            disabled={isClearing}
            className="px-6 py-2 border-3 border-on-surface font-space-grotesk font-bold uppercase text-on-surface hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={isClearing}
            className="px-6 py-2 bg-[#ff4a4a] border-3 border-on-surface text-white font-space-grotesk font-bold uppercase shadow-[4px_4px_0_var(--shadow-color)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
          >
            {isClearing ? 'CLEARING...' : 'CLEAR'}
          </button>
        </div>
      </div>
    </div>
  );
}
