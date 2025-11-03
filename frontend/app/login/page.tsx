'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8"
      >
        <div className="w-full max-w-md">
          {/* FourKites Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <img src="/fk_logo.png" alt="FourKites" className="h-12" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Welcome to FourKites Agentic Workflow Builder
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-600 mb-8"
          >
            Sign in to get started
          </motion.p>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-700">
                {error === 'OAuthAccountNotLinked' || error === 'AccessDenied'
                  ? '❌ Access Denied: Only @fourkites.com email addresses are allowed'
                  : '❌ Authentication error. Please try again.'}
              </p>
            </motion.div>
          )}

          {/* Google Sign-In Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(37, 99, 235, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </motion.button>

          {/* Demo Button - Temporary for Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-4"
          >
            <motion.a
              whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(75, 85, 99, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              href="/"
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              Continue to Workflow Builder (Demo)
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-6 text-xs text-gray-500"
          >
            <p>You understand that FourKites will process your personal information as described in the{' '}
              <a href="#" className="text-blue-600 hover:underline">FourKites Privacy Policy</a>{' '}
              to provide the FourKites Platform.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Decorative Circles */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl"
        />

        <div className="relative z-10 text-white max-w-lg">
          {/* FourKites Logo (White) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-12"
          >
            <img src="/fk_logo.png" alt="FourKites" className="h-14 brightness-0 invert" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-4xl font-bold mb-6 leading-tight"
          >
            Empowering the world's leading brands with end-to-end supply chain agility since 2014
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid grid-cols-3 gap-8 mt-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <div className="text-4xl font-bold mb-2">3.2M</div>
              <div className="text-sm text-blue-200">Shipments Tracked Every Single Day</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <div className="text-4xl font-bold mb-2">1,200+</div>
              <div className="text-sm text-blue-200">Customers Connected</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <div className="text-4xl font-bold mb-2">550,000+</div>
              <div className="text-sm text-blue-200">Carriers Onboarded</div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 flex gap-6 text-sm"
          >
            <a href="#" className="text-blue-200 hover:text-white transition-colors">Acceptable Use Policy</a>
            <a href="#" className="text-blue-200 hover:text-white transition-colors">Copyright Policy</a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
