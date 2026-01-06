"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TAG_COLORS, DEFAULT_TAG_COLOR } from "@/lib/constants";
import type { Tag } from "@/types/database";

interface TagManagerProps {
  accountId: string;
  tags: Tag[];
  onRefresh: () => void;
}

export function TagManager({ accountId, tags, onRefresh }: TagManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_TAG_COLOR);

  const resetForm = () => {
    setName("");
    setColor(DEFAULT_TAG_COLOR);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          name: name.trim(),
          color,
        }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        onRefresh();
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tags?id=${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tags</h3>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground w-full">
            No tags yet. Add one to organize your expenses.
          </p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm text-white"
              style={{ backgroundColor: tag.color ?? "#6366f1" }}
            >
              {tag.name}
              <button
                onClick={() => handleDelete(tag.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tag name (e.g., vacation, work)"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((colorValue) => (
                  <button
                    key={colorValue}
                    type="button"
                    onClick={() => setColor(colorValue)}
                    className={`h-8 w-8 rounded-full ${
                      color === colorValue ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: colorValue }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Tag
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
