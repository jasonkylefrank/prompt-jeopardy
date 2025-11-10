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
      <path d="M18.42 8.32c.18-.43.25-.9.2-1.36-.1-.92-.6-1.72-1.28-2.3C16.3 3.69 15.02 3 13.68 3c-1.6 0-3.05.8-4 2.02l-.1.12C8.62 4.02 7.29 3.14 5.76 3.14c-1.93 0-3.5 1.57-3.5 3.5 0 .91.35 1.74.92 2.36.18.2.37.38.58.55l-2.4 6.31c-.2.51-.15 1.08.13 1.54.28.46.77.74 1.29.74h15.44c.52 0 1.01-.28 1.29-.74.28-.46.33-1.04.13-1.54l-2.2-5.77Z M10.5 13.5h3l-1.5 2-1.5-2Z" />
    </svg>
  );
};
