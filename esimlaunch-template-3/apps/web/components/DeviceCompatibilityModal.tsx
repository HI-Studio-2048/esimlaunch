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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card p-6"
        style={{
          background: 'var(--night-50)',
          border: '1px solid var(--border-bright)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          Is your device eSIM compatible?
        </h2>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
          Make sure your phone supports eSIM before purchasing. Compatible devices include:
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {COMPATIBLE_DEVICES.map((d, i) => (
            <li key={i} className="flex items-start gap-2" style={{ color: 'var(--text)' }}>
              <span style={{ color: 'var(--glow)' }}>✓</span>
              {d}
            </li>
          ))}
        </ul>
        <label className="mt-6 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="h-4 w-4 rounded"
            style={{ accentColor: 'var(--electric)' }}
          />
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            I understand my device must support eSIM
          </span>
        </label>
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="btn-ghost flex-1"
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
            className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            I understand, continue
          </button>
        </div>
      </div>
    </div>
  );
}
