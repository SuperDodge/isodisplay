import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gray-900 px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="glass-card rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-brand-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/70 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>

          <div className="space-y-3">
            <Link
              href="/displays"
              className="block w-full py-3 px-4 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold rounded-lg transition duration-200"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/auth/logout"
              className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition duration-200 border border-white/20"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}