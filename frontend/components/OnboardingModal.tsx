'use client';

import { useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requirement: string) => void;
}

export default function OnboardingModal({ isOpen, onClose, onSubmit }: OnboardingModalProps) {
  const [requirement, setRequirement] = useState('');
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onSubmit(requirement);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h2 className="text-3xl font-bold">Welcome to Workflow Builder</h2>
          </div>
          <p className="text-blue-100">
            {step === 1
              ? 'Let AI help you build the perfect workflow'
              : 'Describe what you want to automate'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 ? (
            // Step 1: Introduction
            <div className="space-y-6">
              <div className="text-center">
                <svg
                  className="w-24 h-24 mx-auto mb-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Build Workflows in Minutes, Not Hours
                </h3>
                <p className="text-gray-600">
                  Our AI assistant helps you create complex workflows by understanding your requirements
                  in plain English.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-900">Natural Language</p>
                  <p className="text-xs text-gray-600 mt-1">Just describe what you want</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-900">Smart Recommendations</p>
                  <p className="text-xs text-gray-600 mt-1">AI suggests the best blocks</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <svg className="w-8 h-8 mx-auto mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-900">One-Click Deploy</p>
                  <p className="text-xs text-gray-600 mt-1">Ready to execute instantly</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Quick Start Examples:</p>
                    <ul className="text-xs text-gray-700 mt-1 space-y-1">
                      <li>• "Send email, wait 1 hour, check for reply, if no reply send follow-up"</li>
                      <li>• "Check database for late deliveries and alert manager"</li>
                      <li>• "Monitor temperature sensor and escalate if threshold exceeded"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Requirements Input
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  What workflow do you want to create?
                </label>
                <textarea
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Example: Send an email requesting shipment status, wait 2 hours for reply, use AI to check if response is complete, if incomplete send follow-up email, if gibberish escalate to manager..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-sm resize-none"
                  rows={8}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about timing, conditions, and what should happen in different scenarios
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 mb-1">Tips for better results:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Mention time intervals (e.g., "wait 1 hour", "every Monday")</li>
                  <li>• Specify conditions (e.g., "if no reply", "if temperature &gt; 45°F")</li>
                  <li>• Include escalation paths (e.g., "if incomplete, follow up", "if urgent, notify manager")</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            {step === 1 ? 'Skip & Build Manually' : 'Go Back'}
          </button>
          <div className="flex gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={step === 2 && !requirement.trim()}
              className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
            >
              {step === 1 ? (
                <>
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Build My Workflow
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
