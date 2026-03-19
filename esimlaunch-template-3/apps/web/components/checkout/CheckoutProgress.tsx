'use client';

const STEPS = [
  { label: 'Review order', num: 1 },
  { label: 'Payment', num: 2 },
  { label: 'Confirmation', num: 3 },
];

interface CheckoutProgressProps {
  /** 1 = checkout page, 2 = payment (same as 1 for Stripe redirect), 3 = success page */
  step: 1 | 2 | 3;
}

export function CheckoutProgress({ step }: CheckoutProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const isActive = step >= s.num;
          const isComplete = step > s.num;
          return (
            <div key={s.num} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition"
                  style={
                    isActive
                      ? { backgroundColor: 'var(--electric)', color: '#fff' }
                      : {
                          backgroundColor: 'var(--night-100)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }
                  }
                >
                  {isComplete ? '✓' : s.num}
                </div>
                <span
                  className="mt-2 text-xs font-medium"
                  style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="mx-2 h-0.5 flex-1 transition-colors"
                  style={{
                    backgroundColor: isComplete ? 'var(--electric)' : 'var(--night-100)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
