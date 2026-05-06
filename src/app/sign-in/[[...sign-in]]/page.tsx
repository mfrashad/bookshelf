import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50">
      <SignIn fallbackRedirectUrl="/library" signUpUrl="/sign-up" />
    </main>
  );
}
