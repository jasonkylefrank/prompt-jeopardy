import { cn } from "@/lib/utils";

export const AppLogo = ({ className, ...props }: React.ComponentProps<"svg">) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path d="M18.83 5.34a2 2 0 0 0-1.66-1.31L12 3l-5.17 1.03a2 2 0 0 0-1.66 1.31L4 10v3a2 2 0 0 0 2 2h3.54c.26 1.63 1.22 3.09 2.46 4.09 1.24-.99 2.2-2.45 2.46-4.09H18a2 2 0 0 0 2-2v-3l-1.17-4.66zM12 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  );
};
