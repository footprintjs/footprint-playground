import { useRef, useCallback, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface BottomSheetProps {
  /** Content shown when collapsed (1-line peek) */
  peek: React.ReactNode;
  /** Full content shown when expanded */
  children: React.ReactNode;
  /** Phase color for the handle accent */
  accentColor?: string;
}

/** Snap points as fraction of container height */
const SNAP_COLLAPSED = 0.12; // ~12% — peek only
const SNAP_HALF = 0.5;      // 50%
const SNAP_FULL = 0.88;     // 88%

/**
 * Draggable bottom sheet with three snap points.
 * Uses framer-motion for smooth drag + spring animations.
 */
export function BottomSheet({ peek, children, accentColor = "var(--phase-execute)" }: BottomSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState(0);
  const [snapFraction, setSnapFraction] = useState(SNAP_COLLAPSED);

  // Measure container on mount / resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // sheetHeight motion value drives the sheet's rendered height
  const sheetHeight = useMotionValue(containerH * SNAP_COLLAPSED);

  // Keep sheetHeight in sync when containerH or snap changes
  useEffect(() => {
    if (containerH > 0) {
      animate(sheetHeight, containerH * snapFraction, { type: "spring", stiffness: 400, damping: 35 });
    }
  }, [containerH, snapFraction, sheetHeight]);

  // Border radius shrinks as sheet opens
  const borderRadius = useTransform(sheetHeight, [0, containerH * SNAP_FULL], [16, 4]);

  const onDragEnd = useCallback(
    (_: unknown, info: { velocity: { y: number } }) => {
      if (containerH === 0) return;
      // Current height after drag
      const currentH = sheetHeight.get();
      const velocity = -info.velocity.y; // positive = dragging up (expanding)

      // Determine target snap based on position + velocity
      const fraction = currentH / containerH;
      const snaps = [SNAP_COLLAPSED, SNAP_HALF, SNAP_FULL];

      let target: number;
      if (Math.abs(velocity) > 300) {
        // Fast fling — go to next snap in direction
        if (velocity > 0) {
          target = snaps.find((s) => s > fraction + 0.05) ?? SNAP_FULL;
        } else {
          target = [...snaps].reverse().find((s) => s < fraction - 0.05) ?? SNAP_COLLAPSED;
        }
      } else {
        // Slow drag — snap to nearest
        target = snaps.reduce((best, s) =>
          Math.abs(s - fraction) < Math.abs(best - fraction) ? s : best
        );
      }

      setSnapFraction(target);
    },
    [containerH, sheetHeight]
  );

  const isExpanded = snapFraction > SNAP_COLLAPSED;

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: sheetHeight,
          borderRadius,
          background: "var(--bg-secondary)",
          borderTop: `2px solid ${accentColor}`,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pointerEvents: "auto",
          touchAction: "none",
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDrag={(_, info) => {
          // Live drag — update height as user drags
          const delta = -info.delta.y;
          const next = Math.max(
            containerH * 0.08,
            Math.min(containerH * 0.92, sheetHeight.get() + delta)
          );
          sheetHeight.set(next);
        }}
        onDragEnd={onDragEnd}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "8px 0 4px",
            cursor: "grab",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: accentColor,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Peek content (always visible) */}
        <div style={{ padding: "0 12px 8px", flexShrink: 0 }}>
          {peek}
        </div>

        {/* Full content (scrollable when expanded) */}
        <div
          style={{
            flex: 1,
            overflow: isExpanded ? "auto" : "hidden",
            opacity: isExpanded ? 1 : 0,
            transition: "opacity 0.2s ease",
            padding: isExpanded ? "0 12px 12px" : "0 12px",
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
