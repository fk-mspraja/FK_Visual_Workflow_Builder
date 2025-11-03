'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Database,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Mail,
  Bell,
  Zap,
  FileText,
  Calendar,
  Hash,
  ToggleLeft,
  Phone,
  Paperclip,
} from 'lucide-react';
import {
  OrchestrationConfig,
  ParsingRule,
  EscalationLevel,
  ORCHESTRATION_CONFIGS,
  getOrchestrationConfigById,
} from '../lib/orchestrationConfig';

interface OrchestrationConfigPanelProps {
  onSelectConfig: (config: OrchestrationConfig) => void;
  onCreateCustomConfig: () => void;
}

export function OrchestrationConfigPanel({
  onSelectConfig,
  onCreateCustomConfig,
}: OrchestrationConfigPanelProps) {
  const [selectedConfig, setSelectedConfig] = useState<OrchestrationConfig | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    parsing: boolean;
    escalation: boolean;
    orchestration: boolean;
  }>({
    parsing: true,
    escalation: false,
    orchestration: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getFieldTypeIcon = (type: ParsingRule['type']) => {
    switch (type) {
      case 'text': return <FileText className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'boolean': return <ToggleLeft className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'attachment': return <Paperclip className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3 mb-3">
          <Settings className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Orchestration Config</h2>
            <p className="text-xs text-gray-600">Configure parsing, escalation & workflow logic</p>
          </div>
        </div>

        <button
          onClick={onCreateCustomConfig}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create Custom Config
        </button>
      </div>

      {/* Config Selection */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">Pre-configured Templates</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {ORCHESTRATION_CONFIGS.map((config) => (
            <motion.button
              key={config.id}
              onClick={() => {
                setSelectedConfig(config);
                onSelectConfig(config);
              }}
              className={`w-full p-3 rounded-lg text-left transition-all border-2 ${
                selectedConfig?.id === config.id
                  ? 'bg-indigo-50 border-indigo-500'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900">{config.name}</h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{config.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                      {config.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {config.parsingRules.length} fields
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {config.escalationLevels.length} levels
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Config Details */}
      {selectedConfig && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Parsing Rules Section */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('parsing')}
              className="w-full p-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">
                  Parsing Rules ({selectedConfig.parsingRules.length})
                </h3>
              </div>
              {expandedSections.parsing ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.parsing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white"
                >
                  <div className="p-3 space-y-2">
                    {selectedConfig.parsingRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getFieldTypeIcon(rule.type)}
                            <div>
                              <h4 className="font-semibold text-sm text-gray-900">{rule.name}</h4>
                              <p className="text-xs text-gray-500">Field: {rule.field}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {rule.required ? (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                Required
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                Optional
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {rule.type}
                            </span>
                          </div>
                        </div>

                        {rule.extractionHints.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">AI Hints:</p>
                            <div className="flex flex-wrap gap-1">
                              {rule.extractionHints.map((hint, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded border border-cyan-200"
                                >
                                  {hint}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rule.examples.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Examples:</p>
                            <div className="space-y-1">
                              {rule.examples.slice(0, 2).map((example, i) => (
                                <p key={i} className="text-xs text-gray-600 italic">
                                  &quot;{example}&quot;
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {rule.pattern && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700">Pattern:</p>
                            <code className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                              {rule.pattern}
                            </code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Escalation Levels Section */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('escalation')}
              className="w-full p-3 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm text-gray-900">
                  Escalation Levels ({selectedConfig.escalationLevels.length})
                </h3>
              </div>
              {expandedSections.escalation ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.escalation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white"
                >
                  <div className="p-3 space-y-3">
                    {selectedConfig.escalationLevels.map((level, index) => (
                      <div
                        key={level.level}
                        className="p-3 bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-lg border-2 border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                              {level.level}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{level.name}</h4>
                              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                <Clock className="w-3 h-3" />
                                Triggers after {level.triggerAfter}h
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-bold border ${getPriorityColor(
                              level.actions.priority
                            )}`}
                          >
                            {level.actions.priority.toUpperCase()}
                          </span>
                        </div>

                        {/* Trigger Conditions */}
                        <div className="mb-3">
                          <p className="text-xs font-bold text-gray-700 mb-1">Conditions:</p>
                          <div className="flex flex-wrap gap-1">
                            {level.triggerConditions.noResponse && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded border border-red-200">
                                No Response
                              </span>
                            )}
                            {level.triggerConditions.incompleteResponse && (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-200">
                                Incomplete
                              </span>
                            )}
                            {level.triggerConditions.criticalDelay && (
                              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded border border-orange-200">
                                Critical Delay
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-700">Recipients:</p>
                              <p className="text-xs text-gray-600">
                                {level.actions.emailRecipients.join(', ')}
                              </p>
                              {level.actions.ccRecipients && level.actions.ccRecipients.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  CC: {level.actions.ccRecipients.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <p className="text-xs text-gray-700">
                              Template: <span className="font-semibold">{level.actions.templateId}</span>
                            </p>
                          </div>

                          {(level.actions.notifySlack || level.actions.notifyPagerDuty) && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {level.actions.notifySlack && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                                  <Bell className="w-3 h-3" />
                                  Slack
                                </span>
                              )}
                              {level.actions.notifyPagerDuty && (
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  PagerDuty
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Orchestration Settings Section */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('orchestration')}
              className="w-full p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-sm text-gray-900">Orchestration Settings</h3>
              </div>
              {expandedSections.orchestration ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.orchestration && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white"
                >
                  <div className="p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Max Retries</p>
                        <p className="text-lg font-bold text-blue-900">
                          {selectedConfig.orchestration.maxRetries}
                        </p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs text-purple-600 font-semibold mb-1">Retry Interval</p>
                        <p className="text-lg font-bold text-purple-900">
                          {selectedConfig.orchestration.retryInterval}h
                        </p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-600 font-semibold mb-1">Timeout</p>
                        <p className="text-lg font-bold text-orange-900">
                          {selectedConfig.orchestration.timeoutHours}h
                        </p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-600 font-semibold mb-1">Parallel</p>
                        <p className="text-lg font-bold text-green-900">
                          {selectedConfig.orchestration.parallelProcessing ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>

                    {selectedConfig.orchestration.conditionalLogic.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-700 mb-2">Conditional Rules:</p>
                        <div className="space-y-2">
                          {selectedConfig.orchestration.conditionalLogic.map((rule) => (
                            <div
                              key={rule.id}
                              className="p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200"
                            >
                              <div className="flex items-start gap-2">
                                <Zap className="w-4 h-4 text-indigo-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-gray-900">
                                    IF: <code className="text-purple-600">{rule.condition}</code>
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    THEN: <span className="font-semibold">{rule.action}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Completion Criteria
                      </p>
                      <p className="text-xs text-gray-700">
                        Required fields:{' '}
                        <span className="font-semibold">
                          {selectedConfig.completionCriteria.requiredFields.join(', ')}
                        </span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!selectedConfig && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Select a configuration template to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}
