'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { WORKFLOW_TEMPLATES_ENTERPRISE } from '@/lib/enterpriseTemplates';
import { ACTION_BLOCKS, getActionsByCategory } from '@/lib/actions';
import { FourKitesWorkflowBuilderV2 } from '@/components/FourKitesWorkflowBuilderV2';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'templates' | 'actions'>('templates');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAIBuilder, setShowAIBuilder] = useState(false);

  const categories = ['All', 'Logistics', 'Compliance', 'Operations'];
  const actionsByCategory = getActionsByCategory();

  const filteredTemplates = selectedCategory === 'All'
    ? WORKFLOW_TEMPLATES_ENTERPRISE
    : WORKFLOW_TEMPLATES_ENTERPRISE.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/fourkites-logo.png"
                  alt="FourKites"
                  width={140}
                  height={32}
                  className="h-8 w-auto"
                />
                <div className="h-8 w-px bg-slate-300"></div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900">Workflow Orchestrator</h1>
                  <p className="text-xs text-slate-500">Enterprise Automation Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/history"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </Link>
              <Link
                href="/builder?guide=true"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-all flex items-center gap-2 shadow-sm"
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
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-8 py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Production-Ready Automation
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Enterprise Workflow Platform
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Pre-built workflow templates and drag-and-drop automation for logistics operations.
              Deploy scalable workflows powered by Temporal orchestration.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAIBuilder(true)}
                className="group px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  🤖
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Create with AI</div>
                  <div className="text-xs text-blue-100">From requirement documents</div>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>

              <Link
                href="/builder?guide=true"
                className="px-6 py-3.5 bg-white hover:bg-gray-50 text-slate-900 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                Build Manually
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'templates'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Workflow Templates
                <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                  {WORKFLOW_TEMPLATES_ENTERPRISE.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'actions'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Action Library
                <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                  {Object.keys(ACTION_BLOCKS).length}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Templates View */}
      {activeTab === 'templates' && (
        <div className="max-w-[1600px] mx-auto px-8 py-12">
          {/* Category Filter */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-sm font-medium text-slate-700">Filter by category:</span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
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
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-200"
              >
                {/* Template Header */}
                <div className={`h-24 bg-gradient-to-br ${template.gradient} relative`}>
                  <div className="absolute inset-0 bg-black/5"></div>
                  <div className="absolute top-3 right-3">
                    <div className={`px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm border ${
                      template.complexity === 'simple' ? 'bg-green-500/20 text-white border-white/20' :
                      template.complexity === 'moderate' ? 'bg-yellow-500/20 text-white border-white/20' :
                      'bg-red-500/20 text-white border-white/20'
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
                    <span className="text-slate-300">•</span>
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
                      <span className="text-slate-500 text-xs">nodes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-900">{template.edges.length}</span>
                      <span className="text-slate-500 text-xs">connections</span>
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
      )}

      {/* Actions View */}
      {activeTab === 'actions' && (
        <div className="max-w-[1600px] mx-auto px-8 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Action Block Library</h2>
            <p className="text-slate-600">
              Drag these action blocks into the builder to create custom workflows.
              Each block represents a specific operation in your automation.
            </p>
          </div>

          {/* Actions by Category */}
          {Object.entries(actionsByCategory).map(([category, actions]) => (
            <div key={category} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-bold text-slate-900">{category}</h3>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                  {actions.length} blocks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`flex-shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center text-xl`}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm leading-tight mb-1">
                          {action.name}
                        </h4>
                        <div className="text-xs text-slate-500">
                          {action.action_count} action{action.action_count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3">
                      {action.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{action.required_params.length} required params</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-20">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span>© 2024 FourKites. All rights reserved.</span>
              <span>•</span>
              <span>Powered by Temporal</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-600 font-medium">Enterprise Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Workflow Builder - Full Screen 2-Panel Layout */}
      {showAIBuilder && (
        <div className="fixed inset-0 z-50 bg-white">
          <FourKitesWorkflowBuilderV2
            onClose={() => setShowAIBuilder(false)}
            onWorkflowGenerated={(workflowJson) => {
              console.log('Workflow generated:', workflowJson);
            }}
          />
        </div>
      )}
    </div>
  );
}
