'use client';

import { ActionBlockDefinition } from '@/lib/actions';

interface ActionCardProps {
  action: ActionBlockDefinition;
}

export default function ActionCard({ action }: ActionCardProps) {
  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-gray-300">
      {/* Gradient Header */}
      <div className={`h-2 bg-gradient-to-r ${action.gradient}`} />

      <div className="p-6">
        {/* Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}
          >
            {action.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {action.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-black uppercase tracking-wide">
                {action.category}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  action.action_count === 1
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {action.action_count} action{action.action_count > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-black mb-4 line-clamp-2">
          {action.description}
        </p>

        {/* Parameters */}
        <div className="space-y-2">
          {action.required_params.length > 0 && (
            <div>
              <div className="text-xs font-medium text-black mb-1">
                Required Parameters:
              </div>
              <div className="flex flex-wrap gap-1">
                {action.required_params.map((param) => (
                  <span
                    key={param}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs border border-red-200"
                    title={action.param_descriptions[param] || param}
                  >
                    {param}
                  </span>
                ))}
              </div>
            </div>
          )}

          {action.optional_params.length > 0 && (
            <div>
              <div className="text-xs font-medium text-black mb-1">
                Optional Parameters:
              </div>
              <div className="flex flex-wrap gap-1">
                {action.optional_params.map((param) => (
                  <span
                    key={param}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs border border-blue-200"
                    title={action.param_descriptions[param] || param}
                  >
                    {param}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Border */}
      <div
        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}
      />
    </div>
  );
}
