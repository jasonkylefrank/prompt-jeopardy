import { cn } from "@/lib/utils";

export const AppLogo = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.05.36 2.05.98 2.85" />
      <path d="M12 2a4.5 4.5 0 0 1 4.5 4.5c0 1.05-.36 2.05-.98 2.85" />
      <path d="M12 12.5a4.5 4.5 0 0 1-4.5-4.5" />
      <path d="M12 12.5a4.5 4.5 0 0 0 4.5-4.5" />
      <path d="M17.5 8.5c.32.22.63.48.9.77" />
      <path d="M6.5 8.5c-.32.22-.63.48-.9.77" />
      <path d="M12 18a2.5 2.5 0 0 0-2.5 2.5c0 1.38.93 2.5 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.93-2.5-2.5-2.5z" />
      <path d="M12 12.5V18" />
      <path d="M15.5 8.5a4.5 4.5 0 0 1 0 5" />
      <path d="M8.5 8.5a4.5 4.5 0 0 0 0 5" />
      <path d="M12 8a.5.5 0 0 0-.5.5v0a.5.5 0 0 0 .5.5" />
      <path d="M12 8a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5" />
    </svg>
  );
};
