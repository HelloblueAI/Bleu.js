import React from 'react';

const SignupForm: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleGoogleSignup = () => {
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleGithubSignup = () => {
    window.location.href = `${apiUrl}/auth/github`;
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-gray-600">
          Or{' '}
          <a href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
            sign in to your account
          </a>
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleGithubSignup}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          <i className="fab fa-github text-xl mr-3"></i>
          <span className="font-medium">Continue with GitHub</span>
        </button>

        <button
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          <i className="fab fa-google text-xl mr-3"></i>
          <span className="font-medium">Continue with Google</span>
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        By continuing, you agree to our{' '}
        <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
          Privacy Policy
        </a>
      </p>
    </div>
  );
};

export default SignupForm; 