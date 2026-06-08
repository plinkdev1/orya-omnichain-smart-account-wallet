'use client';

/**
 * Vault Customization Modal
 * Long-press customization UI for vault action buttons
 * Supports drag-to-reorder and toggle visibility
 */

import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { VaultAction } from '@/hooks/useVaultWidgetCustomization';
import { useVaultWidgetCustomization } from '@/hooks/useVaultWidgetCustomization';

interface VaultCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletType?: 'standard' | 'multi-sig' | 'smart-contract';
}

export function VaultCustomizationModal({
  open,
  onOpenChange,
  walletType = 'standard',
}: VaultCustomizationModalProps) {
  const {
    preferences,
    isLoaded,
    toggleActionVisibility,
    reorderActions,
    resetToDefaults,
    commitChanges,
  } = useVaultWidgetCustomization(walletType);

  const [actions, setActions] = useState<VaultAction[]>([]);
  const [draggedItem, setDraggedItem] = useState<VaultAction | null>(null);

  useEffect(() => {
    if (isLoaded && preferences.actions) {
      setActions(preferences.actions);
    }
  }, [preferences.actions, isLoaded]);

  const handleDragStart = (action: VaultAction) => {
    setDraggedItem(action);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetAction: VaultAction) => {
    if (!draggedItem || draggedItem.id === targetAction.id) return;

    const draggedIndex = actions.findIndex((a) => a.id === draggedItem.id);
    const targetIndex = actions.findIndex((a) => a.id === targetAction.id);

    const newActions = [...actions];
    newActions.splice(draggedIndex, 1);
    newActions.splice(targetIndex, 0, draggedItem);

    setActions(newActions);
    setDraggedItem(null);
  };

  const handleToggleVisibility = (actionId: string) => {
    const newActions = actions.map((action) =>
      action.id === actionId ? { ...action, visible: !action.visible } : action
    );
    setActions(newActions);
  };

  const handleSave = () => {
    reorderActions(actions);
    onOpenChange(false);
  };

  const handleReset = () => {
    resetToDefaults();
    onOpenChange(false);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4">
          <h3 className="font-semibold text-foreground">Customize Actions</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Drag to reorder, toggle visibility
          </p>
        </div>

        {/* Actions List */}
        <div className="divide-y">
          {actions.map((action) => (
            <div
              key={action.id}
              draggable
              onDragStart={() => handleDragStart(action)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(action)}
              className={`flex items-center gap-3 p-3 cursor-move transition-colors ${
                draggedItem?.id === action.id
                  ? 'bg-primary/10 opacity-50'
                  : 'hover:bg-secondary/50'
              } ${!action.visible ? 'opacity-50' : ''}`}
            >
              {/* Drag Handle */}
              <GripVertical size={16} className="flex-shrink-0 text-muted-foreground" />

              {/* Action Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {action.label}
                </p>
              </div>

              {/* Toggle Visibility */}
              <button
                onClick={() => handleToggleVisibility(action.id)}
                className="p-1.5 rounded-lg hover:bg-secondary/80 transition-colors flex-shrink-0"
                title={action.visible ? 'Hide action' : 'Show action'}
              >
                {action.visible ? (
                  <Eye size={16} className="text-primary" />
                ) : (
                  <EyeOff size={16} className="text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t bg-secondary/30 p-4 flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors border border-border/50"
            title="Reset to default configuration"
          >
            <RotateCcw size={14} className="inline mr-1" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
