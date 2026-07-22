"use client";

import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeezerLinkButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      render={<a href="https://www.deezer.com" target="_blank" rel="noopener noreferrer" />}
    >
      <Music className="size-4" />
      Ouvrir Deezer
    </Button>
  );
}
