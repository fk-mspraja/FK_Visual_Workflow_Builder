'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Filter, Save, Code } from 'lucide-react';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'between';

export type FilterLogic = 'AND' | 'OR';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

export interface FilterGroup {
  id: string;
  logic: FilterLogic;
  conditions: FilterCondition[];
  groups?: FilterGroup[];
}

interface QueryFilterBuilderProps {
  fields: Array<{ name: string; label: string; type: 'string' | 'number' | 'date' | 'boolean' }>;
  initialFilter?: FilterGroup;
  onChange: (filter: FilterGroup) => void;
  onSave?: (filter: FilterGroup) => void;
}

export function QueryFilterBuilder({
  fields,
  initialFilter,
  onChange,
  onSave
}: QueryFilterBuilderProps) {
  const [rootGroup, setRootGroup] = useState<FilterGroup>(
    initialFilter || {
      id: 'root',
      logic: 'AND',
      conditions: [],
      groups: [],
    }
  );
  const [showSQL, setShowSQL] = useState(false);

  const operatorsByType: Record<string, { value: FilterOperator; label: string }[]> = {
    string: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does Not Contain' },
      { value: 'starts_with', label: 'Starts With' },
      { value: 'ends_with', label: 'Ends With' },
      { value: 'in', label: 'In List' },
      { value: 'not_in', label: 'Not In List' },
      { value: 'is_null', label: 'Is Null' },
      { value: 'is_not_null', label: 'Is Not Null' },
    ],
    number: [
      { value: 'equals', label: '=' },
      { value: 'not_equals', label: '!=' },
      { value: 'greater_than', label: '>' },
      { value: 'less_than', label: '<' },
      { value: 'greater_or_equal', label: '>=' },
      { value: 'less_or_equal', label: '<=' },
      { value: 'between', label: 'Between' },
      { value: 'in', label: 'In List' },
      { value: 'is_null', label: 'Is Null' },
      { value: 'is_not_null', label: 'Is Not Null' },
    ],
    date: [
      { value: 'equals', label: 'On' },
      { value: 'not_equals', label: 'Not On' },
      { value: 'greater_than', label: 'After' },
      { value: 'less_than', label: 'Before' },
      { value: 'greater_or_equal', label: 'On or After' },
      { value: 'less_or_equal', label: 'On or Before' },
      { value: 'between', label: 'Between' },
      { value: 'is_null', label: 'Is Null' },
      { value: 'is_not_null', label: 'Is Not Null' },
    ],
    boolean: [
      { value: 'equals', label: 'Is' },
      { value: 'not_equals', label: 'Is Not' },
      { value: 'is_null', label: 'Is Null' },
      { value: 'is_not_null', label: 'Is Not Null' },
    ],
  };

  const addCondition = (group: FilterGroup) => {
    const newCondition: FilterCondition = {
      id: `cond_${Date.now()}`,
      field: fields[0]?.name || '',
      operator: 'equals',
      value: '',
      dataType: fields[0]?.type || 'string',
    };

    const updatedGroup = {
      ...group,
      conditions: [...group.conditions, newCondition],
    };

    if (group.id === 'root') {
      setRootGroup(updatedGroup);
      onChange(updatedGroup);
    }
  };

  const removeCondition = (group: FilterGroup, conditionId: string) => {
    const updatedGroup = {
      ...group,
      conditions: group.conditions.filter((c) => c.id !== conditionId),
    };

    if (group.id === 'root') {
      setRootGroup(updatedGroup);
      onChange(updatedGroup);
    }
  };

  const updateCondition = (
    group: FilterGroup,
    conditionId: string,
    updates: Partial<FilterCondition>
  ) => {
    const updatedGroup = {
      ...group,
      conditions: group.conditions.map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    };

    if (group.id === 'root') {
      setRootGroup(updatedGroup);
      onChange(updatedGroup);
    }
  };

  const toggleLogic = (group: FilterGroup) => {
    const updatedGroup = {
      ...group,
      logic: group.logic === 'AND' ? 'OR' as FilterLogic : 'AND' as FilterLogic,
    };

    if (group.id === 'root') {
      setRootGroup(updatedGroup);
      onChange(updatedGroup);
    }
  };

  const addGroup = (parentGroup: FilterGroup) => {
    const newGroup: FilterGroup = {
      id: `group_${Date.now()}`,
      logic: 'AND',
      conditions: [],
      groups: [],
    };

    const updatedGroup = {
      ...parentGroup,
      groups: [...(parentGroup.groups || []), newGroup],
    };

    if (parentGroup.id === 'root') {
      setRootGroup(updatedGroup);
      onChange(updatedGroup);
    }
  };

  const removeGroup = (parentGroup: FilterGroup, groupId: string) => {
    const updatedGroup = {
      ...parentGroup,
      groups: (parentGroup.groups || []).filter((g) => g.id !== groupId),
    };

    if (parentGroup.id === 'root') {
      setRootGroup(updatedGroup);
      onChange(updatedGroup);
    }
  };

  const generateSQL = (group: FilterGroup, level: number = 0): string => {
    const indent = '  '.repeat(level);
    const conditions: string[] = [];

    // Add conditions
    group.conditions.forEach((cond) => {
      const field = fields.find((f) => f.name === cond.field);
      if (!field) return;

      let sql = '';
      const fieldName = cond.field;

      switch (cond.operator) {
        case 'equals':
          sql = `${fieldName} = '${cond.value}'`;
          break;
        case 'not_equals':
          sql = `${fieldName} != '${cond.value}'`;
          break;
        case 'contains':
          sql = `${fieldName} LIKE '%${cond.value}%'`;
          break;
        case 'not_contains':
          sql = `${fieldName} NOT LIKE '%${cond.value}%'`;
          break;
        case 'starts_with':
          sql = `${fieldName} LIKE '${cond.value}%'`;
          break;
        case 'ends_with':
          sql = `${fieldName} LIKE '%${cond.value}'`;
          break;
        case 'greater_than':
          sql = `${fieldName} > ${cond.value}`;
          break;
        case 'less_than':
          sql = `${fieldName} < ${cond.value}`;
          break;
        case 'greater_or_equal':
          sql = `${fieldName} >= ${cond.value}`;
          break;
        case 'less_or_equal':
          sql = `${fieldName} <= ${cond.value}`;
          break;
        case 'in':
          const inValues = Array.isArray(cond.value)
            ? cond.value.map((v: any) => `'${v}'`).join(', ')
            : cond.value.split(',').map((v: string) => `'${v.trim()}'`).join(', ');
          sql = `${fieldName} IN (${inValues})`;
          break;
        case 'not_in':
          const notInValues = Array.isArray(cond.value)
            ? cond.value.map((v: any) => `'${v}'`).join(', ')
            : cond.value.split(',').map((v: string) => `'${v.trim()}'`).join(', ');
          sql = `${fieldName} NOT IN (${notInValues})`;
          break;
        case 'between':
          if (Array.isArray(cond.value) && cond.value.length === 2) {
            sql = `${fieldName} BETWEEN ${cond.value[0]} AND ${cond.value[1]}`;
          }
          break;
        case 'is_null':
          sql = `${fieldName} IS NULL`;
          break;
        case 'is_not_null':
          sql = `${fieldName} IS NOT NULL`;
          break;
      }

      if (sql) conditions.push(sql);
    });

    // Add nested groups
    (group.groups || []).forEach((nestedGroup) => {
      const nestedSQL = generateSQL(nestedGroup, level + 1);
      if (nestedSQL) {
        conditions.push(`(\n${indent}  ${nestedSQL}\n${indent})`);
      }
    });

    return conditions.join(`\n${indent}${group.logic} `);
  };

  const renderCondition = (group: FilterGroup, condition: FilterCondition, index: number) => {
    const field = fields.find((f) => f.name === condition.field);
    const operators = field ? operatorsByType[field.type] : [];

    return (
      <motion.div
        key={condition.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        {/* Logic connector */}
        {index > 0 && (
          <div className="flex-shrink-0 w-12 text-center">
            <span className="text-xs font-bold text-indigo-600">{group.logic}</span>
          </div>
        )}

        {/* Field selector */}
        <select
          value={condition.field}
          onChange={(e) => {
            const selectedField = fields.find((f) => f.name === e.target.value);
            updateCondition(group, condition.id, {
              field: e.target.value,
              dataType: selectedField?.type || 'string',
            });
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          {fields.map((field) => (
            <option key={field.name} value={field.name}>
              {field.label}
            </option>
          ))}
        </select>

        {/* Operator selector */}
        <select
          value={condition.operator}
          onChange={(e) =>
            updateCondition(group, condition.id, { operator: e.target.value as FilterOperator })
          }
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        {/* Value input */}
        {condition.operator !== 'is_null' && condition.operator !== 'is_not_null' && (
          <>
            {condition.dataType === 'boolean' ? (
              <select
                value={condition.value}
                onChange={(e) => updateCondition(group, condition.id, { value: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : condition.dataType === 'date' ? (
              <input
                type="date"
                value={condition.value}
                onChange={(e) => updateCondition(group, condition.id, { value: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            ) : condition.dataType === 'number' ? (
              <input
                type="number"
                value={condition.value}
                onChange={(e) => updateCondition(group, condition.id, { value: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Value"
              />
            ) : (
              <input
                type="text"
                value={condition.value}
                onChange={(e) => updateCondition(group, condition.id, { value: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder={condition.operator === 'in' || condition.operator === 'not_in' ? 'val1, val2, val3' : 'Value'}
              />
            )}
          </>
        )}

        {/* Remove button */}
        <button
          onClick={() => removeCondition(group, condition.id)}
          className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove condition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };

  const renderGroup = (group: FilterGroup, level: number = 0) => {
    const hasContent = group.conditions.length > 0 || (group.groups && group.groups.length > 0);

    return (
      <div
        key={group.id}
        className={`space-y-3 ${level > 0 ? 'ml-6 pl-4 border-l-2 border-indigo-200' : ''}`}
      >
        {/* Logic toggle */}
        {hasContent && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleLogic(group)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                group.logic === 'AND'
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              {group.logic}
            </button>
            <span className="text-xs text-gray-500">
              {group.logic === 'AND' ? 'All conditions must match' : 'Any condition must match'}
            </span>
          </div>
        )}

        {/* Conditions */}
        <AnimatePresence>
          {group.conditions.map((condition, index) => renderCondition(group, condition, index))}
        </AnimatePresence>

        {/* Nested groups */}
        {group.groups &&
          group.groups.map((nestedGroup) => (
            <div key={nestedGroup.id} className="relative">
              {renderGroup(nestedGroup, level + 1)}
              <button
                onClick={() => removeGroup(group, nestedGroup.id)}
                className="absolute -right-2 -top-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                title="Remove group"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

        {/* Add buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addCondition(group)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Add Condition
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addGroup(group)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-medium text-sm rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
          >
            <Plus className="w-4 h-4" />
            Add Group
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Query Filters</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSQL(!showSQL)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              showSQL
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Code className="w-4 h-4" />
            {showSQL ? 'Hide SQL' : 'Show SQL'}
          </button>
          {onSave && (
            <button
              onClick={() => onSave(rootGroup)}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          )}
        </div>
      </div>

      {/* SQL Preview */}
      <AnimatePresence>
        {showSQL && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-x-auto"
          >
            <div className="mb-2 text-gray-400 text-xs">WHERE</div>
            <pre className="whitespace-pre-wrap">{generateSQL(rootGroup) || '-- No filters defined --'}</pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Builder */}
      <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        {renderGroup(rootGroup)}
      </div>

      {/* Helper text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Click AND/OR to toggle logic between conditions</p>
        <p>• Add nested groups for complex conditions like (A AND B) OR (C AND D)</p>
        <p>• Use "In List" operator with comma-separated values</p>
      </div>
    </div>
  );
}
