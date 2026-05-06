import React from 'react';

interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }: ConfirmationDialogProps) {
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
                    <button onClick={onCancel} className="px-4 py-1.5 text-[13px] text-slate-600 hover:bg-slate-200 bg-slate-100 border border-slate-300 rounded transition-colors">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className="px-4 py-1.5 text-[13px] text-white bg-[#005a9e] hover:bg-[#004578] rounded transition-colors shadow-sm">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
