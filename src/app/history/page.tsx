'use client';

/**
 * History Page - Format transformation history
 * 
 * Displays user's formatting history with search and management capabilities
 */

import { useState } from 'react';
import { HistoryDashboard } from '@/components/history/HistoryDashboard';
import { HistoryService } from '@/lib/history/HistoryService';
import type { FormatHistoryEntry } from '@/types/history';

// Mock history service for demonstration
const historyService = new HistoryService();

export default function HistoryPage() {
  const [selectedEntry, setSelectedEntry] = useState<FormatHistoryEntry | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <HistoryDashboard
        historyService={historyService}
        onEntrySelect={setSelectedEntry}
        className="max-w-6xl mx-auto"
      />
    </div>
  );
}
