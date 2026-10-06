import type { Line } from "@/lib/api";

/**
 * Lines of in-game text. Each segment keeps the game's style (item colours) and size;
 * glyph segments are drawn with their image.
 */
export function GameText({ lines, className }: { lines: Line[]; className?: string }) {
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <p key={i}>
          {line.length === 0
            ? " "
            : line.map((seg, j) =>
                seg.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={j} className="glyph" src={seg.image} alt={seg.glyph ?? ""} />
                ) : (
                  <span
                    key={j}
                    className={seg.style ? `s-${seg.style}` : undefined}
                    style={seg.size ? ({ "--s": seg.size } as React.CSSProperties) : undefined}
                  >
                    {seg.text}
                  </span>
                ),
              )}
        </p>
      ))}
    </div>
  );
}
