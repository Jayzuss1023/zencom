import { Providers } from "./Providers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <TooltipProvider delay={200}>
        {children}
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </Providers>
  );
}
