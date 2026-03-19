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
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#1d1d1f] text-white'
                      : 'border border-[#d2d2d7] bg-[#f5f5f7] text-[#adadb8]'
                  }`}
                >
                  {isComplete ? '✓' : s.num}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive ? 'text-[#1d1d1f]' : 'text-[#adadb8]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    isComplete ? 'bg-[#1d1d1f]' : 'bg-[#d2d2d7]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
