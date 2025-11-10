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
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 12a4 4 0 1 0-4-4" />
      <path d="M12 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
};
