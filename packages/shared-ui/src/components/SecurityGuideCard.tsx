import React, { useState } from 'react';
import Link from 'next/link';

export interface SecurityGuide {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'recovery' | 'keys' | '2fa' | 'storage' | 'general';
  content: string;
  actionItems: string[];
  risks: string[];
  references?: string[];
  learnMore?: string;
}

interface SecurityGuideCardProps {
  guide: SecurityGuide;
  compact?: boolean;
  onDismiss?: () => void;
}

const severityColors = {
  critical: 'bg-red-50 border-red-200 text-red-900',
  high: 'bg-orange-50 border-orange-200 text-orange-900',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  low: 'bg-blue-50 border-blue-200 text-blue-900',
};

const severityBadgeColors = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

const severityIcons = {
  critical: '⚠️',
  high: '🔒',
  medium: 'ℹ️',
  low: 'ℹ️',
};

export function SecurityGuideCard({
  guide,
  compact = false,
  onDismiss,
}: SecurityGuideCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (compact && !isExpanded) {
    return (
      <div
        className={`border rounded-lg p-4 ${severityColors[guide.severity]}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{severityIcons[guide.severity]}</span>
            <div>
              <h3 className="font-semibold">{guide.title}</h3>
              <p className="text-sm opacity-75">{guide.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                severityBadgeColors[guide.severity]
              }`}
            >
              {guide.severity.toUpperCase()}
            </span>
            <button
              onClick={() => setIsExpanded(true)}
              className="px-3 py-1 text-sm font-medium hover:opacity-75"
            >
              Learn More
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-2 py-1 text-sm opacity-50 hover:opacity-75"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        severityColors[guide.severity]
      }`}
    >
      {/* Header */}
      <div className="border-b p-4 flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl mt-1">{severityIcons[guide.severity]}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold">{guide.title}</h2>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  severityBadgeColors[guide.severity]
                }`}
              >
                {guide.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-sm opacity-75">{guide.description}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-2 py-1 text-lg opacity-50 hover:opacity-75 ml-2"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div className="prose prose-sm max-w-none">
          {guide.content.split('\n\n').map((paragraph, idx) => (
            <div key={idx}>
              {paragraph.startsWith('## ') ? (
                <h3 className="font-semibold mt-3 mb-2">
                  {paragraph.replace('## ', '')}
                </h3>
              ) : paragraph.startsWith('### ') ? (
                <h4 className="font-medium mt-2 mb-1">
                  {paragraph.replace('### ', '')}
                </h4>
              ) : paragraph.startsWith('✓ ') || paragraph.startsWith('- ') ? (
                <ul className="list-disc list-inside space-y-1">
                  {paragraph
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line, i) => (
                      <li key={i} className="text-sm">
                        {line.replace(/^[✓-]\s*/, '')}
                      </li>
                    ))}
                </ul>
              ) : paragraph.startsWith('```') ? (
                <pre className="bg-black bg-opacity-10 p-2 rounded text-xs overflow-x-auto my-2">
                  <code>{paragraph.replace(/```/g, '')}</code>
                </pre>
              ) : (
                <p className="text-sm leading-relaxed">{paragraph}</p>
              )}
            </div>
          ))}
        </div>

        {/* Action Items */}
        {guide.actionItems.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Action Items</h4>
            <ul className="space-y-2">
              {guide.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    aria-label={`Action: ${item}`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {guide.risks.length > 0 && (
          <div className="bg-black bg-opacity-10 rounded p-3">
            <h4 className="font-semibold text-sm mb-2">⚠️ Risks</h4>
            <ul className="list-disc list-inside space-y-1">
              {guide.risks.map((risk, idx) => (
                <li key={idx} className="text-sm">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Learn More Links */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {guide.learnMore && (
            <Link
              href={guide.learnMore}
              className="text-sm font-semibold hover:underline"
            >
              Learn More →
            </Link>
          )}
          {guide.references && guide.references.length > 0 && (
            <div className="text-sm">
              <span className="opacity-75">References:</span>
              <ul className="inline-block ml-2">
                {guide.references.map((ref, idx) => (
                  <li key={idx} className="inline">
                    <code className="text-xs bg-black bg-opacity-10 px-1 rounded">
                      {ref}
                    </code>
                    {idx < guide.references!.length - 1 && ', '}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SecurityGuidePanelProps {
  guides: SecurityGuide[];
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

export function SecurityGuidePanel({
  guides,
  onDismiss,
  compact = true,
}: SecurityGuidePanelProps) {
  return (
    <div className="space-y-3">
      {guides.map((guide) => (
        <SecurityGuideCard
          key={guide.id}
          guide={guide}
          compact={compact}
          onDismiss={
            onDismiss ? () => onDismiss(guide.id) : undefined
          }
        />
      ))}
    </div>
  );
}
