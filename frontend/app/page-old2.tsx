'use client';

import Link from 'next/link';
import { useState } from 'react';
import { WORKFLOW_TEMPLATES_ENTERPRISE } from '@/lib/enterpriseTemplates';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Logistics', 'Compliance', 'Operations'];

  const filteredTemplates = selectedCategory === 'All'
    ? WORKFLOW_TEMPLATES_ENTERPRISE
    : WORKFLOW_TEMPLATES_ENTERPRISE.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">FourKites Orchestrator</h1>
                <p className="text-xs text-slate-500">Enterprise Workflow Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/history"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                History
              </Link>
              <Link
                href="/builder"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Custom Workflow
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-[1400px] mx-auto px-8 pt-16 pb-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-700 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Production-Ready Templates
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
            Workflow Templates
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-8">
            Launch automated workflows in minutes with enterprise-grade templates.
            Fully configurable and battle-tested in production environments.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
          <div className="ml-auto text-sm text-slate-500">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-200"
            >
              {/* Template Header */}
              <div className={`h-28 bg-gradient-to-br ${template.gradient} relative`}>
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl opacity-90">{template.icon}</div>
                </div>
                <div className="absolute top-3 right-3">
                  <div className={`px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm ${
                    template.complexity === 'simple' ? 'bg-green-500/20 text-white' :
                    template.complexity === 'moderate' ? 'bg-yellow-500/20 text-white' :
                    'bg-red-500/20 text-white'
                  }`}>
                    {template.complexity}
                  </div>
                </div>
              </div>

              {/* Template Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                  {template.name}
                </h3>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {template.category}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {template.estimatedTime}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-slate-900">{template.nodes.length}</span>
                    <span className="text-slate-500 text-xs">steps</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className="font-semibold text-slate-900">{template.edges.length}</span>
                    <span className="text-slate-500 text-xs">actions</span>
                  </div>
                </div>

                {/* Use Button */}
                <Link
                  href={`/builder?template=${template.id}`}
                  className="block w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-center font-semibold text-sm rounded-lg transition-all"
                >
                  Use Template
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 mt-20">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>Powered by Temporal • Enterprise Scale • Production Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
}
