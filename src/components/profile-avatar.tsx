import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const PALETTE = ["bg-chart-1", "bg-chart-5"];

export function ProfileAvatar({
  profile,
  index = 0,
  size = "default",
  className,
}: {
  profile: Profile | null | undefined;
  index?: number;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const initial = profile?.display_name?.charAt(0).toUpperCase() ?? "?";
  const color = PALETTE[index % PALETTE.length];

  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className={cn(color, "text-white font-medium")}>{initial}</AvatarFallback>
    </Avatar>
  );
}
