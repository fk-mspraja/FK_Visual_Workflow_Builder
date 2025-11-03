'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Database,
  Mail,
  Calendar,
  PlayCircle,
  Code,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Filter,
} from 'lucide-react';
import { QueryFilterBuilder, FilterGroup } from './QueryFilterBuilder';

export type TriggerType = 'scheduled' | 'email' | 'manual' | 'sql_query' | 'webhook';

export interface ScheduledTrigger {
  type: 'scheduled';
  schedule: string; // Cron expression
  timezone?: string;
  description?: string;
}

export interface EmailTrigger {
  type: 'email';
  monitorInbox: string; // email address to monitor
  filters: {
    from?: string;
    subject?: string;
    hasAttachment?: boolean;
    keywords?: string[];
  };
  checkInterval: number; // minutes
  description?: string;
}

export interface SQLQueryTrigger {
  type: 'sql_query';
  database: {
    host: string;
    port: number;
    database: string;
    username: string;
  };
  query: string;
  schedule: string; // Cron expression
  triggerCondition: {
    type: 'row_count' | 'value_match' | 'value_threshold';
    operator?: '>' | '<' | '=' | '!=' | '>=' | '<=';
    value?: any;
    column?: string;
  };
  description?: string;
}

export interface ManualTrigger {
  type: 'manual';
  description?: string;
}

export interface WebhookTrigger {
  type: 'webhook';
  endpoint: string;
  method: 'POST' | 'GET';
  authentication?: {
    type: 'bearer' | 'basic' | 'api_key';
    value: string;
  };
  description?: string;
}

export type WorkflowTrigger =
  | ScheduledTrigger
  | EmailTrigger
  | SQLQueryTrigger
  | ManualTrigger
  | WebhookTrigger;

interface TriggerBuilderProps {
  onTriggerCreate: (trigger: WorkflowTrigger) => void;
  onClose: () => void;
}

export function TriggerBuilder({ onTriggerCreate, onClose }: TriggerBuilderProps) {
  const [selectedType, setSelectedType] = useState<TriggerType | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('config');

  // Scheduled Trigger State
  const [schedule, setSchedule] = useState('0 9 * * *');
  const [timezone, setTimezone] = useState('America/New_York');

  // Email Trigger State
  const [emailMonitor, setEmailMonitor] = useState('');
  const [emailFilters, setEmailFilters] = useState({
    from: '',
    subject: '',
    hasAttachment: false,
    keywords: [] as string[],
  });
  const [checkInterval, setCheckInterval] = useState(5);

  // SQL Query Trigger State
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
  });
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlSchedule, setSqlSchedule] = useState('*/15 * * * *');
  const [triggerCondition, setTriggerCondition] = useState({
    type: 'row_count' as const,
    operator: '>' as const,
    value: 0,
    column: '',
  });
  const [sqlFilterGroup, setSqlFilterGroup] = useState<FilterGroup | null>(null);
  const [showSqlFilterBuilder, setShowSqlFilterBuilder] = useState(false);

  // Email Filter Group State
  const [emailFilterGroup, setEmailFilterGroup] = useState<FilterGroup | null>(null);
  const [showEmailFilterBuilder, setShowEmailFilterBuilder] = useState(false);

  const [description, setDescription] = useState('');

  const triggerTypes = [
    {
      type: 'scheduled' as TriggerType,
      icon: Clock,
      name: 'Scheduled Trigger',
      description: 'Run workflow on a fixed schedule (cron)',
      color: 'from-blue-500 to-cyan-500',
      example: 'Every day at 9 AM',
    },
    {
      type: 'email' as TriggerType,
      icon: Mail,
      name: 'Email Trigger',
      description: 'Monitor inbox and trigger on new emails',
      color: 'from-purple-500 to-pink-500',
      example: 'When BOL email arrives',
    },
    {
      type: 'sql_query' as TriggerType,
      icon: Database,
      name: 'SQL Query Trigger',
      description: 'Query database and trigger based on results',
      color: 'from-green-500 to-emerald-500',
      example: 'When late shipments > 10',
    },
    {
      type: 'manual' as TriggerType,
      icon: PlayCircle,
      name: 'Manual Trigger',
      description: 'Manually trigger the workflow',
      color: 'from-orange-500 to-red-500',
      example: 'Click to run',
    },
    {
      type: 'webhook' as TriggerType,
      icon: Zap,
      name: 'Webhook Trigger',
      description: 'HTTP endpoint to trigger workflow',
      color: 'from-indigo-500 to-purple-500',
      example: 'POST /webhook/workflow',
    },
  ];

  const cronPresets = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day at 9 AM', value: '0 9 * * *' },
    { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
    { label: 'Every weekday at 9 AM', value: '0 9 * * 1-5' },
    { label: 'First day of month', value: '0 9 1 * *' },
  ];

  const handleCreate = () => {
    let trigger: WorkflowTrigger;

    switch (selectedType) {
      case 'scheduled':
        trigger = {
          type: 'scheduled',
          schedule,
          timezone,
          description,
        };
        break;
      case 'email':
        trigger = {
          type: 'email',
          monitorInbox: emailMonitor,
          filters: emailFilters,
          checkInterval,
          description,
        };
        break;
      case 'sql_query':
        trigger = {
          type: 'sql_query',
          database: dbConfig,
          query: sqlQuery,
          schedule: sqlSchedule,
          triggerCondition,
          description,
        };
        break;
      case 'manual':
        trigger = {
          type: 'manual',
          description,
        };
        break;
      case 'webhook':
        trigger = {
          type: 'webhook',
          endpoint: `/webhook/${Date.now()}`,
          method: 'POST',
          description,
        };
        break;
      default:
        return;
    }

    onTriggerCreate(trigger);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Workflow Trigger Builder</h2>
        <p className="text-sm text-gray-600">
          Configure how and when your workflow should be triggered
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Trigger Type Selection */}
        {!selectedType && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Trigger Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {triggerTypes.map((triggerType) => {
                const Icon = triggerType.icon;
                return (
                  <motion.button
                    key={triggerType.type}
                    onClick={() => setSelectedType(triggerType.type)}
                    className={`p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all text-left bg-gradient-to-br ${triggerType.color}/10 hover:shadow-lg group`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${triggerType.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{triggerType.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{triggerType.description}</p>
                        <p className="text-xs text-gray-500 italic">
                          Example: {triggerType.example}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scheduled Trigger Config */}
        {selectedType === 'scheduled' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Scheduled Trigger Configuration</h3>
              <button
                onClick={() => setSelectedType(null)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Change Type
              </button>
            </div>

            {/* Cron Expression */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Schedule (Cron Expression)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  placeholder="0 9 * * *"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Format: minute hour day month day-of-week
              </p>
            </div>

            {/* Cron Presets */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {cronPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setSchedule(preset.value)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                      schedule === preset.value
                        ? 'bg-indigo-100 border-indigo-500 text-indigo-700 font-semibold'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="America/New_York">America/New York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Daily late shipment check"
              />
            </div>
          </div>
        )}

        {/* Email Trigger Config */}
        {selectedType === 'email' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Email Trigger Configuration</h3>
              <button
                onClick={() => setSelectedType(null)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Change Type
              </button>
            </div>

            {/* Email to Monitor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address to Monitor
              </label>
              <input
                type="email"
                value={emailMonitor}
                onChange={(e) => setEmailMonitor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="shipments@company.com"
              />
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Email Filters (Optional)
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
                <input
                  type="text"
                  value={emailFilters.from}
                  onChange={(e) => setEmailFilters({ ...emailFilters, from: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="sender@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Contains
                </label>
                <input
                  type="text"
                  value={emailFilters.subject}
                  onChange={(e) => setEmailFilters({ ...emailFilters, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="BOL Document"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasAttachment"
                  checked={emailFilters.hasAttachment}
                  onChange={(e) =>
                    setEmailFilters({ ...emailFilters, hasAttachment: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="hasAttachment" className="text-sm font-medium text-gray-700">
                  Must have attachment
                </label>
              </div>
            </div>

            {/* Advanced Email Filter Builder */}
            <div className="space-y-3">
              <button
                onClick={() => setShowEmailFilterBuilder(!showEmailFilterBuilder)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-medium text-sm rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
              >
                <Filter className="w-4 h-4" />
                {showEmailFilterBuilder ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              </button>

              {showEmailFilterBuilder && (
                <div className="p-4 bg-white border-2 border-purple-200 rounded-lg">
                  <QueryFilterBuilder
                    fields={[
                      { name: 'from', label: 'From Address', type: 'string' },
                      { name: 'to', label: 'To Address', type: 'string' },
                      { name: 'subject', label: 'Subject', type: 'string' },
                      { name: 'body', label: 'Email Body', type: 'string' },
                      { name: 'has_attachment', label: 'Has Attachment', type: 'boolean' },
                      { name: 'attachment_count', label: 'Attachment Count', type: 'number' },
                      { name: 'received_date', label: 'Received Date', type: 'date' },
                      { name: 'is_read', label: 'Is Read', type: 'boolean' },
                    ]}
                    onChange={(filter) => setEmailFilterGroup(filter)}
                  />
                </div>
              )}
            </div>

            {/* Check Interval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Check Interval (minutes)
              </label>
              <input
                type="number"
                value={checkInterval}
                onChange={(e) => setCheckInterval(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                max="60"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Monitor for BOL documents"
              />
            </div>
          </div>
        )}

        {/* SQL Query Trigger Config */}
        {selectedType === 'sql_query' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">SQL Query Trigger Configuration</h3>
              <button
                onClick={() => setSelectedType(null)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Change Type
              </button>
            </div>

            {/* Database Config */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900">Database Connection</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                  <input
                    type="text"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                  <input
                    type="number"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Database</label>
                  <input
                    type="text"
                    value={dbConfig.database}
                    onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="shipments_db"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={dbConfig.username}
                    onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="db_user"
                  />
                </div>
              </div>
            </div>

            {/* SQL Query */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SQL Query</label>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                rows={6}
                placeholder="SELECT * FROM shipments&#10;WHERE status = 'late'&#10;  AND delivery_date < NOW()"
              />
            </div>

            {/* Advanced SQL Filter Builder */}
            <div className="space-y-3">
              <button
                onClick={() => setShowSqlFilterBuilder(!showSqlFilterBuilder)}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-medium text-sm rounded-lg hover:bg-green-100 transition-colors border border-green-200"
              >
                <Filter className="w-4 h-4" />
                {showSqlFilterBuilder ? 'Hide WHERE Clause Builder' : 'Build WHERE Clause Visually'}
              </button>

              {showSqlFilterBuilder && (
                <div className="p-4 bg-white border-2 border-green-200 rounded-lg">
                  <QueryFilterBuilder
                    fields={[
                      { name: 'shipment_id', label: 'Shipment ID', type: 'string' },
                      { name: 'status', label: 'Status', type: 'string' },
                      { name: 'carrier_name', label: 'Carrier Name', type: 'string' },
                      { name: 'origin_city', label: 'Origin City', type: 'string' },
                      { name: 'destination_city', label: 'Destination City', type: 'string' },
                      { name: 'delivery_date', label: 'Delivery Date', type: 'date' },
                      { name: 'created_at', label: 'Created At', type: 'date' },
                      { name: 'updated_at', label: 'Updated At', type: 'date' },
                      { name: 'priority', label: 'Priority', type: 'number' },
                      { name: 'delay_hours', label: 'Delay Hours', type: 'number' },
                      { name: 'is_late', label: 'Is Late', type: 'boolean' },
                      { name: 'is_critical', label: 'Is Critical', type: 'boolean' },
                    ]}
                    onChange={(filter) => setSqlFilterGroup(filter)}
                  />
                </div>
              )}
            </div>

            {/* Trigger Condition */}
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-bold text-gray-900">Trigger Condition</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={triggerCondition.type}
                    onChange={(e) =>
                      setTriggerCondition({
                        ...triggerCondition,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="row_count">Row Count</option>
                    <option value="value_match">Value Match</option>
                    <option value="value_threshold">Value Threshold</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                  <select
                    value={triggerCondition.operator}
                    onChange={(e) =>
                      setTriggerCondition({
                        ...triggerCondition,
                        operator: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value=">">Greater Than (&gt;)</option>
                    <option value="<">Less Than (&lt;)</option>
                    <option value="=">Equal (=)</option>
                    <option value="!=">Not Equal (!=)</option>
                    <option value=">=">Greater or Equal (&gt;=)</option>
                    <option value="<=">Less or Equal (&lt;=)</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    value={triggerCondition.value}
                    onChange={(e) =>
                      setTriggerCondition({
                        ...triggerCondition,
                        value: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Example: Trigger when row_count &gt; 10 (when query returns more than 10 rows)
              </p>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Check Schedule (Cron)
              </label>
              <input
                type="text"
                value={sqlSchedule}
                onChange={(e) => setSqlSchedule(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                placeholder="*/15 * * * *"
              />
              <p className="text-xs text-gray-500 mt-1">How often to run the query</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Trigger when late shipments exceed threshold"
              />
            </div>
          </div>
        )}

        {/* Manual & Webhook Triggers */}
        {(selectedType === 'manual' || selectedType === 'webhook') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedType === 'manual' ? 'Manual Trigger' : 'Webhook Trigger'} Configuration
              </h3>
              <button
                onClick={() => setSelectedType(null)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Change Type
              </button>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                {selectedType === 'manual'
                  ? 'This workflow will be triggered manually through the UI or API.'
                  : 'This workflow will be triggered via HTTP webhook endpoint.'}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Manual workflow execution"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedType && (
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Create Trigger
          </button>
        </div>
      )}
    </div>
  );
}
