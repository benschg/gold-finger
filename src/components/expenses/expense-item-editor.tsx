"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, CreateExpenseItemInput } from "@/types/database";

interface ItemWithId extends CreateExpenseItemInput {
  tempId: string;
}

interface ExpenseItemEditorProps {
  items: CreateExpenseItemInput[];
  categories: Category[];
  currencySymbol: string;
  onChange: (items: CreateExpenseItemInput[]) => void;
  expenseCategoryId?: string;
}

interface SortableItemProps {
  item: ItemWithId;
  index: number;
  categories: Category[];
  currencySymbol: string;
  expenseCategoryId?: string;
  onUpdate: (index: number, updates: Partial<CreateExpenseItemInput>) => void;
  onRemove: (index: number) => void;
}

function SortableItem({
  item,
  index,
  categories,
  currencySymbol,
  expenseCategoryId,
  onUpdate,
  onRemove,
}: SortableItemProps) {
  const t = useTranslations("expenses");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.tempId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const expenseCategory = categories.find((c) => c.id === expenseCategoryId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-lg border bg-card p-3"
    >
      <button
        type="button"
        className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_80px_100px]">
          <Input
            placeholder={t("itemName")}
            value={item.name}
            onChange={(e) => onUpdate(index, { name: e.target.value })}
          />
          <Input
            type="number"
            step="1"
            min="1"
            placeholder={t("qty")}
            value={item.quantity || 1}
            onChange={(e) =>
              onUpdate(index, { quantity: parseFloat(e.target.value) || 1 })
            }
            className="w-full"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {currencySymbol}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={item.unit_price || ""}
              onChange={(e) =>
                onUpdate(index, {
                  unit_price: parseFloat(e.target.value) || 0,
                })
              }
              className="pl-7"
            />
          </div>
        </div>

        <Select
          value={item.category_id || "inherit"}
          onValueChange={(value) =>
            onUpdate(index, { category_id: value === "inherit" ? null : value })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t("itemCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">
              {t("inheritCategory")}
              {expenseCategory && ` (${expenseCategory.name})`}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Counter for generating unique IDs
let itemIdCounter = 0;
const getNextTempId = () => `item-${++itemIdCounter}`;

// Helper to add tempIds to items
const addTempIds = (items: CreateExpenseItemInput[]): ItemWithId[] =>
  items.map((item) => ({ ...item, tempId: getNextTempId() }));

export function ExpenseItemEditor({
  items,
  categories,
  currencySymbol,
  onChange,
  expenseCategoryId,
}: ExpenseItemEditorProps) {
  const t = useTranslations("expenses");

  // Track the items prop length to detect external changes
  const prevItemsLengthRef = useRef(items.length);

  // Add tempId for drag-and-drop tracking
  const [itemsWithIds, setItemsWithIds] = useState<ItemWithId[]>(() =>
    addTempIds(items),
  );

  // Sync with external items when they change (e.g., from AI analysis)
  // Only update if the items prop changed from outside (detected by length change)
  // eslint-disable-next-line react-hooks/refs -- Syncing external state is intentional here
  if (
    items.length !== prevItemsLengthRef.current &&
    items.length !== itemsWithIds.length
  ) {
    // eslint-disable-next-line react-hooks/refs -- Intentional ref update for sync
    prevItemsLengthRef.current = items.length;
    setItemsWithIds(addTempIds(items));
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addItem = () => {
    const newItem: ItemWithId = {
      name: "",
      quantity: 1,
      unit_price: 0,
      category_id: null,
      tempId: getNextTempId(),
    };
    const newItems = [...itemsWithIds, newItem];
    setItemsWithIds(newItems);
    onChange(stripTempIds(newItems));
  };

  const updateItem = (
    index: number,
    updates: Partial<CreateExpenseItemInput>,
  ) => {
    const newItems = [...itemsWithIds];
    newItems[index] = { ...newItems[index], ...updates };
    setItemsWithIds(newItems);
    onChange(stripTempIds(newItems));
  };

  const removeItem = (index: number) => {
    const newItems = itemsWithIds.filter((_, i) => i !== index);
    setItemsWithIds(newItems);
    onChange(stripTempIds(newItems));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = itemsWithIds.findIndex((i) => i.tempId === active.id);
      const newIndex = itemsWithIds.findIndex((i) => i.tempId === over.id);

      const newItems = arrayMove(itemsWithIds, oldIndex, newIndex);

      // Update sort_order
      newItems.forEach((item, i) => {
        item.sort_order = i;
      });

      setItemsWithIds(newItems);
      onChange(stripTempIds(newItems));
    }
  };

  const stripTempIds = (items: ItemWithId[]): CreateExpenseItemInput[] => {
    return items.map(({ tempId: _tempId, ...item }) => item);
  };

  const total = itemsWithIds.reduce(
    (sum, item) => sum + (item.quantity || 1) * (item.unit_price || 0),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{t("lineItems")}</Label>
        {itemsWithIds.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {t("itemsTotal")}: {currencySymbol}
            {total.toFixed(2)}
          </span>
        )}
      </div>

      {itemsWithIds.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemsWithIds.map((i) => i.tempId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {itemsWithIds.map((item, index) => (
                <SortableItem
                  key={item.tempId}
                  item={item}
                  index={index}
                  categories={categories}
                  currencySymbol={currencySymbol}
                  expenseCategoryId={expenseCategoryId}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("addItem")}
      </Button>
    </div>
  );
}
