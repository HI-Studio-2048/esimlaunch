'use client';

import { useState } from 'react';

interface DeviceCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const COMPATIBLE_DEVICES = [
  'iPhone XS, XR, 11, 12, 13, 14, 15, 16 and later',
  'Google Pixel 3 and later',
  'Samsung Galaxy S20, S21, S22, S23, S24 and later',
  'Samsung Galaxy Z Fold, Z Flip series',
  'Google Pixel Fold',
  'iPad (cellular models)',
  'Other eSIM-capable devices',
];

export function DeviceCompatibilityModal({ isOpen, onClose, onConfirm }: DeviceCompatibilityModalProps) {
  const [understood, setUnderstood] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">Is your device eSIM compatible?</h2>
        <p className="mt-2 text-slate-600">
          Make sure your phone supports eSIM before purchasing. Compatible devices include:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {COMPATIBLE_DEVICES.map((d, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-violet-500">✓</span>
              {d}
            </li>
          ))}
        </ul>
        <label className="mt-6 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-sm text-slate-700">I understand my device must support eSIM</span>
        </label>
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (understood) {
                onConfirm();
                onClose();
              }
            }}
            disabled={!understood}
            className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            I understand, continue
          </button>
        </div>
      </div>
    </div>
  );
}
