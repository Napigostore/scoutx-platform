"use client";

export interface EvidenceItem {
  id: string;
  url?: string;
  photoUrl?: string;
  caption: string;
  capturedAt: string;
  capturedBy?: string;
  verified: boolean;
  mimeType?: string;
  type?: string;
}

interface EvidenceGalleryProps {
  items: EvidenceItem[];
  missionId?: string;
  onItemsChange?: (items: EvidenceItem[]) => void;
}

export function EvidenceGallery({ items }: EvidenceGalleryProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Evidence Gallery</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-muted group relative cursor-pointer overflow-hidden rounded-md border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url || item.photoUrl}
              alt={item.caption}
              className="h-32 w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="p-2">
              <p className="truncate text-xs font-medium">{item.caption}</p>
              <div className="text-muted-foreground mt-1 flex items-center justify-between text-[10px]">
                <span>{item.capturedAt}</span>
                {item.verified && (
                  <span className="rounded bg-green-500/10 px-1 py-0.5 font-semibold text-green-600">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
