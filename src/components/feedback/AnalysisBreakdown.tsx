/**
 * AnalysisBreakdown Component - Shows detected patterns and analysis
 * 
 * Features:
 * - Pattern detection visualization
 * - Entity extraction display
 * - Text structure analysis
 * - Statistics overview
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Hash, 
  List, 
  Calendar, 
  Link as LinkIcon,
  Mail,
  User,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormattedOutput } from '@/types/formatting';

export interface AnalysisBreakdownProps {
  output: FormattedOutput;
  className?: string;
}

export function AnalysisBreakdown({
  output,
  className,
}: AnalysisBreakdownProps) {
  const { metadata, data } = output;
  const { stats, confidence, itemCount } = metadata;
  const { common } = data;

  const hasEntities = common.dates.length > 0 ||
                     common.urls.length > 0 ||
                     common.emails.length > 0 ||
                     common.mentions.length > 0 ||
                     common.hashtags.length > 0;

  return (
    <Card className={cn('border-orange-200/50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-handwritten flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          Analysis Breakdown
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Hash}
            label="Lines Processed"
            value={stats.linesProcessed}
            color="text-blue-600"
          />
          <StatCard
            icon={List}
            label="Items Found"
            value={itemCount}
            color="text-green-600"
          />
          <StatCard
            icon={FileText}
            label="Patterns Matched"
            value={stats.patternsMatched}
            color="text-purple-600"
          />
          <StatCard
            icon={FileText}
            label="Changes Applied"
            value={stats.changesApplied}
            color="text-orange-600"
          />
        </div>

        {/* Extracted Entities */}
        {hasEntities && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Detected Elements</p>
            <div className="space-y-2">
              {common.dates.length > 0 && (
                <EntityRow
                  icon={Calendar}
                  label="Dates"
                  count={common.dates.length}
                  color="text-blue-600"
                />
              )}
              {common.urls.length > 0 && (
                <EntityRow
                  icon={LinkIcon}
                  label="URLs"
                  count={common.urls.length}
                  color="text-indigo-600"
                />
              )}
              {common.emails.length > 0 && (
                <EntityRow
                  icon={Mail}
                  label="Emails"
                  count={common.emails.length}
                  color="text-green-600"
                />
              )}
              {common.mentions.length > 0 && (
                <EntityRow
                  icon={User}
                  label="Mentions"
                  count={common.mentions.length}
                  color="text-purple-600"
                />
              )}
              {common.hashtags.length > 0 && (
                <EntityRow
                  icon={Tag}
                  label="Hashtags"
                  count={common.hashtags.length}
                  color="text-pink-600"
                />
              )}
            </div>
          </div>
        )}

        {/* Confidence indicator */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Processing Quality</span>
            <Badge variant="outline" className={cn(
              confidence > 0.7 ? 'bg-green-50 text-green-700 border-green-200' :
              confidence > 0.5 ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            )}>
              {Math.round(confidence * 100)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Stat card component
 */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-xs text-gray-600 font-content">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
    </div>
  );
}

/**
 * Entity row component
 */
function EntityRow({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-sm text-gray-700 font-content">{label}</span>
      </div>
      <Badge variant="secondary" className="text-xs">
        {count}
      </Badge>
    </div>
  );
}
