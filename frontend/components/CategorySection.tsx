'use client';

import { ActionBlockDefinition, getCategoryInfo } from '@/lib/actions';
import ActionCard from './ActionCard';

interface CategorySectionProps {
  category: string;
  actions: ActionBlockDefinition[];
}

export default function CategorySection({ category, actions }: CategorySectionProps) {
  const categoryInfo = getCategoryInfo(category);

  return (
    <section className="mb-16">
      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryInfo.gradient} flex items-center justify-center text-3xl shadow-lg`}
          >
            {categoryInfo.icon}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{category}</h2>
            <p className="text-gray-600 mt-1">{categoryInfo.description}</p>
          </div>
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </section>
  );
}
