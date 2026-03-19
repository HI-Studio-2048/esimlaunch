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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1d1f]/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[18px] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold text-[#1d1d1f]">Is your device eSIM compatible?</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 shrink-0 text-[#6e6e73] transition-colors hover:text-[#1d1d1f]"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-[#6e6e73]">
          Make sure your phone supports eSIM before purchasing. Compatible devices include:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[#1d1d1f]">
          {COMPATIBLE_DEVICES.map((d, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              {d}
            </li>
          ))}
        </ul>
        <label className="mt-6 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="h-4 w-4 rounded border-[#d2d2d7] text-[#1d1d1f] focus:ring-[#1d1d1f]"
          />
          <span className="text-sm text-[#1d1d1f]">I understand my device must support eSIM</span>
        </label>
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[12px] border border-[#d2d2d7] px-4 py-3 text-sm font-medium text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]"
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
            className="flex-1 rounded-[12px] bg-[#1d1d1f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2d2d2f] disabled:cursor-not-allowed disabled:opacity-40"
          >
            I understand, continue
          </button>
        </div>
      </div>
    </div>
  );
}
