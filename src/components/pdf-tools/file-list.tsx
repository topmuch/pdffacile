"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileEntry {
  id: string;
  file: File;
  pages?: number | null;
}

function SortableRow({
  entry,
  index,
  total,
  onRemove,
  onMove,
  reorderable,
}: {
  entry: FileEntry;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  reorderable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id, disabled: !reorderable });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors",
        isDragging && "z-10 shadow-lg border-primary/40"
      )}
    >
      {reorderable ? (
        <button
          type="button"
          aria-label={`Réordonner ${entry.file.name}`}
          className="cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <div className="w-6 text-center text-xs font-semibold text-muted-foreground">
          {index + 1}
        </div>
      )}

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40">
        <FileText className="h-5 w-5 text-red-500" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={entry.file.name}>
          {entry.file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.pages ? `${entry.pages} page${entry.pages > 1 ? "s" : ""}` : "—"}
          {" · "}
          {(entry.file.size / 1024).toFixed(0)} Ko
        </p>
      </div>

      {reorderable && (
        <div className="flex flex-col">
          <button
            type="button"
            aria-label="Monter"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Descendre"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Supprimer ${entry.file.name}`}
        onClick={() => onRemove(entry.id)}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

export function FileList({
  entries,
  onRemove,
  onReorder,
  reorderable = false,
}: {
  entries: FileEntry[];
  onRemove: (id: string) => void;
  onReorder?: (entries: FileEntry[]) => void;
  reorderable?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    onReorder(arrayMove(entries, oldIndex, newIndex));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= entries.length) return;
    onReorder?.(arrayMove(entries, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {entries.map((entry, index) => (
            <SortableRow
              key={entry.id}
              entry={entry}
              index={index}
              total={entries.length}
              onRemove={onRemove}
              onMove={move}
              reorderable={reorderable}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
