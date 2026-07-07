import { cn } from "@/lib/utils";

/**
 * MyChat wordmark + logo glyph. The glyph is a gradient speech bubble with a
 * spark, shared across the marketing header and footer.
 */
export function BrandMark({
  className,
  glyphClassName,
  wordClassName,
  showWord = true,
}: {
  className?: string;
  glyphClassName?: string;
  wordClassName?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_4px_16px_-4px_var(--brand)]",
          glyphClassName,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[18px]"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 11.5C4 7.36 7.58 4 12 4s8 3.36 8 7.5S16.42 19 12 19c-.83 0-1.63-.12-2.38-.34L5 20l.9-3.2A6.9 6.9 0 0 1 4 11.5Z"
            fill="currentColor"
            fillOpacity="0.95"
          />
          <path
            d="m13.4 8.2.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9.9-1.9Z"
            fill="var(--brand)"
          />
        </svg>
      </span>
      {showWord && (
        <span
          className={cn(
            "text-[17px] font-semibold tracking-tight",
            wordClassName,
          )}
        >
          MyChat
        </span>
      )}
    </span>
  );
}
