import { currentUser } from "@clerk/nextjs/server";
import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">CodeCollab AI</h1>
        <p className="mt-4 text-lg text-gray-400">
          Collaborative AI-powered coding platform
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          {user ? (
            <>
              <UserButton afterSignOutUrl="/" />
              <a
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </a>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg border border-gray-600 px-6 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
