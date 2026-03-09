import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface MobileBuildLayoutProps {
  /** Code panel (top) */
  code: React.ReactNode;
  /** Flowchart panel (bottom) */
  chart: React.ReactNode;
  /** Optional overlay (description) */
  overlay?: React.ReactNode;
}

const MIN_TOP_FRACTION = 0.25;
const MAX_TOP_FRACTION = 0.75;
const DEFAULT_TOP_FRACTION = 0.55;

/**
 * Build phase mobile layout:
 * - Vertical stack with code on top (55%) and chart on bottom (45%)
 * - Draggable divider to adjust the ratio
 * - Tap chart area to expand it (toggle between 55/45 and 30/70)
 */
export function MobileBuildLayout({ code, chart, overlay }: MobileBuildLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topFraction, setTopFraction] = useState(DEFAULT_TOP_FRACTION);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const isDragging = useRef(false);

  const onDividerDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isDragging.current = true;
    const container = containerRef.current;
    if (!container) return;

    const move = (clientY: number) => {
      const rect = container.getBoundingClientRect();
      const fraction = (clientY - rect.top) / rect.height;
      setTopFraction(Math.max(MIN_TOP_FRACTION, Math.min(MAX_TOP_FRACTION, fraction)));
      setIsChartExpanded(false);
    };

    if ("touches" in e) {
      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        move(ev.touches[0].clientY);
      };
      const onTouchEnd = () => {
        isDragging.current = false;
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    } else {
      const onMouseMove = (ev: MouseEvent) => {
        ev.preventDefault();
        move(ev.clientY);
      };
      const onMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
  }, []);

  const toggleChartExpand = useCallback(() => {
    if (isDragging.current) return;
    setIsChartExpanded((prev) => {
      setTopFraction(prev ? DEFAULT_TOP_FRACTION : 0.3);
      return !prev;
    });
  }, []);

  const topPct = `${topFraction * 100}%`;
  const bottomPct = `${(1 - topFraction) * 100}%`;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Code panel (top) */}
      <motion.div
        animate={{ height: topPct }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        style={{ overflow: "hidden", flexShrink: 0 }}
      >
        {code}
      </motion.div>

      {/* Draggable divider */}
      <div
        onMouseDown={onDividerDrag}
        onTouchStart={onDividerDrag}
        onDoubleClick={toggleChartExpand}
        style={{
          height: 20,
          marginTop: -10,
          marginBottom: -10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "row-resize",
          zIndex: 10,
          touchAction: "none",
          position: "relative",
        }}
      >
        {/* Visual handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: "var(--phase-build)",
            opacity: 0.5,
          }}
        />
      </div>

      {/* Chart panel (bottom) — tap to expand */}
      <motion.div
        animate={{ height: bottomPct }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        style={{
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
          cursor: "pointer",
        }}
        onClick={toggleChartExpand}
      >
        {/* Expand/collapse hint */}
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 8,
            zIndex: 5,
            fontSize: 10,
            color: "var(--text-muted)",
            background: "var(--bg-secondary)",
            padding: "2px 6px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            pointerEvents: "none",
            opacity: 0.7,
          }}
        >
          {isChartExpanded ? "tap to shrink" : "tap to expand"}
        </div>
        {chart}
      </motion.div>

      {/* Overlay (description) positioned over the chart area */}
      {overlay}
    </div>
  );
}
