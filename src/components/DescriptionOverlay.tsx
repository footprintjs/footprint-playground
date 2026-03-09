import { motion, AnimatePresence } from "framer-motion";

interface DescriptionOverlayProps {
  description: string | undefined;
  visible: boolean;
  onDismiss: () => void;
  isMobile?: boolean;
}

/**
 * Floating blurred card that shows stage or flowchart descriptions during build phase.
 * Single-line = individual stage description. Multi-line = full chart.description after build().
 * Click the card to dismiss. On mobile, appears as a bottom sheet.
 */
export function DescriptionOverlay({ description, visible, onDismiss, isMobile }: DescriptionOverlayProps) {
  const isFullDescription = description?.includes("\n");
  const label = isFullDescription ? "chart.description" : "Stage Description";

  return (
    <AnimatePresence>
      {visible && description && (
        <motion.div
          initial={isMobile
            ? { opacity: 0, y: 40 }
            : { opacity: 0, y: 16, scale: 0.95 }
          }
          animate={isMobile
            ? { opacity: 1, y: 0 }
            : { opacity: 1, y: 0, scale: 1 }
          }
          exit={isMobile
            ? { opacity: 0, y: 40 }
            : { opacity: 0, y: -8, scale: 0.98 }
          }
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onClick={onDismiss}
          style={isMobile ? {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: "16px 16px 20px",
            background: "rgba(30, 30, 40, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "14px 14px 0 0",
            textAlign: "left",
            boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.3)",
            cursor: "pointer",
          } : {
            position: "absolute",
            top: 24,
            right: 24,
            zIndex: 10,
            maxWidth: isFullDescription ? 380 : 320,
            padding: isFullDescription ? "24px 28px" : "20px 24px",
            background: "rgba(30, 30, 40, 0.65)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 14,
            textAlign: "left",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: isFullDescription ? "var(--success)" : "var(--phase-build)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: isFullDescription ? 12 : 8,
              fontFamily: isFullDescription ? "'JetBrains Mono', monospace" : "inherit",
            }}
          >
            {label}
          </div>
          {isFullDescription ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {description.split("\n").map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "rgba(255, 255, 255, 0.85)",
                    lineHeight: 1.5,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.9)",
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
