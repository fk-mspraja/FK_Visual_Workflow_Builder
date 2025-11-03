'use client';

import { useState, useEffect } from 'react';
import { useWorkflowStore, WorkflowNode } from '@/lib/store';
import { ACTION_BLOCKS } from '@/lib/actions';
import { EMAIL_TEMPLATES, getTemplateById, fillTemplate } from '@/lib/emailTemplates';

export default function ConfigPanel() {
  const { selectedNode, updateNodeParams, selectNode } = useWorkflowStore();
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data.params || {});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Node Selected
          </h3>
          <p className="text-sm text-slate-700">
            Click on a node to configure its parameters
          </p>
        </div>
      </div>
    );
  }

  const actionBlock = ACTION_BLOCKS[selectedNode.data.activity];

  if (!actionBlock) {
    return (
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Invalid Action
          </h3>
          <p className="text-sm text-slate-700">
            This action block is not recognized
          </p>
        </div>
      </div>
    );
  }

  const handleInputChange = (paramName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleSave = () => {
    updateNodeParams(selectedNode.id, formData);
    // Auto-close panel after save with a brief success indicator
    setTimeout(() => {
      selectNode(null);
    }, 300);
  };

  const handleClose = () => {
    selectNode(null);
  };

  const renderInput = (paramName: string, isRequired: boolean) => {
    const description = actionBlock.param_descriptions[paramName] || paramName;
    const value = formData[paramName] || '';

    // Special handling for extraction_schema in extract_data_from_pdf activity
    if (paramName === 'extraction_schema' && selectedNode.data.activity === 'extract_data_from_pdf') {
      const schema = typeof value === 'object' ? value : {};
      const schemaFields = Object.entries(schema).filter(([key]) => !key.startsWith('//'));

      return (
        <div key={paramName} className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Extraction Fields
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <p className="text-xs text-slate-600 mb-3">Define the fields you want to extract from the PDF document</p>

          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
            {schemaFields.map(([fieldName, fieldDescription], index) => (
              <div key={index} className="flex gap-2 items-start bg-white p-2 rounded border border-gray-200">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => {
                      const newSchema = { ...schema };
                      delete newSchema[fieldName];
                      newSchema[e.target.value] = fieldDescription;
                      handleInputChange(paramName, newSchema);
                    }}
                    placeholder="Field name (e.g., bol_number)"
                    className="w-full px-2 py-1 text-xs text-slate-900 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <input
                    type="text"
                    value={String(fieldDescription)}
                    onChange={(e) => {
                      const newSchema = { ...schema };
                      newSchema[fieldName] = e.target.value;
                      handleInputChange(paramName, newSchema);
                    }}
                    placeholder="Description (e.g., Bill of Lading Number)"
                    className="w-full px-2 py-1 text-xs text-slate-600 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSchema = { ...schema };
                    delete newSchema[fieldName];
                    handleInputChange(paramName, newSchema);
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove field"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const newSchema = { ...schema, [`field_${Object.keys(schema).length + 1}`]: 'Field description' };
              handleInputChange(paramName, newSchema);
            }}
            className="mt-2 w-full px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            + Add Field
          </button>

          <p className="text-xs text-slate-600 mt-2">{description}</p>
        </div>
      );
    }

    // PDF upload for reference document (if activity is extract_data_from_pdf)
    if (paramName === 'reference_pdf' && selectedNode.data.activity === 'extract_data_from_pdf') {
      return (
        <div key={paramName} className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Upload Reference Document
          </label>
          <p className="text-xs text-slate-600 mb-2">Upload a sample PDF to help define extraction fields</p>

          <label className="block w-full px-4 py-3 text-sm text-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-gray-600">Click to upload PDF</span>
              <span className="text-xs text-gray-500">Supported: PDF files only</span>
            </div>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && file.type === 'application/pdf') {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    handleInputChange('reference_pdf_base64', base64.split(',')[1]);
                    handleInputChange('reference_pdf_name', file.name);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>

          {formData.reference_pdf_name && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-center justify-between">
              <span>✓ {formData.reference_pdf_name}</span>
              <button
                type="button"
                onClick={() => {
                  handleInputChange('reference_pdf_base64', '');
                  handleInputChange('reference_pdf_name', '');
                }}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      );
    }

    // Handle array inputs (like missing_fields, cc_list)
    if (paramName.includes('list') || paramName.includes('fields')) {
      return (
        <div key={paramName} className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            {paramName.replace(/_/g, ' ')}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(paramName, e.target.value)}
            placeholder={`${description} (comma-separated)`}
            className="w-full px-3 py-2 text-sm text-slate-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={isRequired}
          />
          <p className="text-xs text-slate-600 mt-1">{description}</p>
        </div>
      );
    }

    // Handle number inputs
    if (paramName.includes('level') || paramName.includes('count') || paramName.includes('timeout')) {
      return (
        <div key={paramName} className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            {paramName.replace(/_/g, ' ')}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(paramName, parseInt(e.target.value) || '')}
            placeholder={description}
            className="w-full px-3 py-2 text-sm text-slate-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={isRequired}
          />
          <p className="text-xs text-slate-600 mt-1">{description}</p>
        </div>
      );
    }

    // Handle email template selector
    if (paramName === 'email_template') {
      const selectedTemplate = getTemplateById(value || 'late-delivery-initial');
      const rendered = selectedTemplate
        ? fillTemplate(selectedTemplate, {
            facility: formData.facility || '[Facility Name]',
            shipment_id: formData.shipment_id || '[Shipment ID]',
            recipient_email: formData.recipient_email || '[Recipient Email]',
          })
        : null;

      return (
        <div key={paramName} className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Email Template
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={value || 'late-delivery-initial'}
            onChange={(e) => handleInputChange(paramName, e.target.value)}
            className="w-full px-3 py-2 text-sm text-slate-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white mb-3"
            required={isRequired}
          >
            {EMAIL_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.icon} {template.name}
              </option>
            ))}
          </select>

          {/* Template Preview */}
          {rendered && (
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">📧 Email Preview</span>
                <button
                  type="button"
                  onClick={() => {
                    const preview = document.getElementById('email-preview');
                    if (preview) {
                      preview.classList.toggle('hidden');
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Toggle
                </button>
              </div>
              <div id="email-preview" className="max-h-96 overflow-y-auto">
                {/* Subject Line */}
                <div className="bg-white px-3 py-2 border-b border-gray-200">
                  <div className="text-xs font-semibold text-slate-700 mb-1">Subject:</div>
                  <div className="text-sm font-medium text-slate-900">{rendered.subject}</div>
                </div>
                {/* Email Body */}
                <div className="bg-white p-4 text-xs whitespace-pre-wrap">
                  {rendered.body}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 mt-2">{description}</p>
        </div>
      );
    }

    // Handle textarea for longer content (including custom_message)
    if (paramName.includes('content') || paramName.includes('message') || paramName.includes('data') || paramName.includes('subject')) {
      const rows = paramName.includes('subject') ? 2 : paramName.includes('message') ? 8 : 4;
      return (
        <div key={paramName} className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 mb-1">
            {paramName.replace(/_/g, ' ')}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleInputChange(paramName, e.target.value)}
            placeholder={description}
            rows={rows}
            className="w-full px-3 py-2 text-sm text-slate-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono"
            required={isRequired}
          />
          <p className="text-xs text-slate-600 mt-1">{description}</p>
          {paramName.includes('message') && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              💡 Tip: Leave empty to use the selected email template. Add custom content to override.
            </div>
          )}
        </div>
      );
    }

    // Default text input
    return (
      <div key={paramName} className="mb-4">
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          {paramName.replace(/_/g, ' ')}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(paramName, e.target.value)}
          placeholder={description}
          className="w-full px-3 py-2 text-sm text-slate-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={isRequired}
        />
        <p className="text-xs text-slate-600 mt-1">{description}</p>
      </div>
    );
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Configure Node</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Node Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedNode.data.gradient} flex items-center justify-center text-xl`}
          >
            {selectedNode.data.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              {selectedNode.data.label}
            </div>
            <div className="text-xs text-slate-600 truncate">
              {actionBlock.category}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Required Parameters */}
          {actionBlock.required_params.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-red-500">*</span>
                Required Parameters
              </h3>
              {actionBlock.required_params.map((param) => renderInput(param, true))}
            </div>
          )}

          {/* Optional Parameters */}
          {actionBlock.optional_params.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Optional Parameters
              </h3>
              {/* Prioritize reference_pdf, filter out pdf_base64 (auto-filled) */}
              {actionBlock.optional_params
                .filter(param => param !== 'pdf_base64') // Hide auto-filled parameter
                .sort((a, b) => {
                  // Show reference_pdf first
                  if (a === 'reference_pdf') return -1;
                  if (b === 'reference_pdf') return 1;
                  return 0;
                })
                .map((param) => renderInput(param, false))}
            </div>
          )}

          {/* Description */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <div className="text-xs font-medium text-blue-900 mb-1">About this action</div>
            <p className="text-xs text-blue-700">{actionBlock.description}</p>
            <div className="mt-2 text-xs text-blue-600">
              Action count: {actionBlock.action_count}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
        </form>
      </div>
    </div>
  );
}
