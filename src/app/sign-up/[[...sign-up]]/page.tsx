import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50">
      <SignUp fallbackRedirectUrl="/onboarding" signInUrl="/sign-in" />
    </main>
  );
}
