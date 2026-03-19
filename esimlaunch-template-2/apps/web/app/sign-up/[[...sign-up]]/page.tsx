import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-surface-soft to-white px-4 py-12">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-card rounded-card border border-surface-border',
            },
          }}
        />
      </div>
    </div>
  );
}
