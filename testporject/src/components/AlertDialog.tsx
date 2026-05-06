import React from 'react';

interface AlertDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

export default function AlertDialog({ isOpen, title, message, onClose }: AlertDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg w-[400px] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-[16px] font-semibold text-slate-900">{title}</h2>
                </div>
                <div className="px-6 py-4">
                    <p className="text-slate-600 text-[13px]">{message}</p>
                </div>
                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b">
                    <button onClick={onClose} className="px-4 py-1.5 text-[13px] text-white bg-[#005a9e] hover:bg-[#004578] rounded transition-colors shadow-sm">
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
