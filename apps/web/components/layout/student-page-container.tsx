import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface StudentPageContainerProps {
  children: ReactNode;
  className?: string;
}

export function StudentPageContainer({ children, className }: StudentPageContainerProps) {
  return (
    <main className={cn("mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8", className)}>
      {children}
    </main>
  );
}
