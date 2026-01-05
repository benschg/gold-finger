"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Camera } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      avatar_url?: string;
      display_name?: string;
    };
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(
    user.user_metadata?.display_name || ""
  );
  const [avatarUrl, setAvatarUrl] = useState(
    user.user_metadata?.avatar_url || ""
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const userInitials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be less than 1MB" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      // Upload to avatars bucket
      const filename = `${user.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filename, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filename);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setMessage({ type: "success", text: "Avatar updated!" });
      router.refresh();
    } catch (error) {
      console.error("Avatar upload error:", error);
      setMessage({ type: "error", text: "Failed to upload avatar" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Profile saved!" });
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={avatarUrl} alt="Avatar" />
            <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Camera className="h-3 w-3" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleAvatarClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Change Avatar
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 max-w-full sm:max-w-md">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Enter your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-fit">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-destructive"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
