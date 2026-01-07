import { SharingContent } from "@/components/settings/sharing-content";

export const metadata = {
  title: "Sharing | Gold-Finger",
  description: "Manage account sharing and invitations",
};

export default function SharingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Sharing
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage account sharing and invitations
        </p>
      </div>

      <SharingContent />
    </div>
  );
}
