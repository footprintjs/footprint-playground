import { useState, type ReactElement } from "react";
import type { Sample } from "../samples/catalog";

/** Build a tree structure from flat samples: group → subgroup → items */
function buildTree(samples: Sample[]) {
  const groups: Array<{
    name: string;
    subgroups: Array<{ name: string; items: Sample[] }>;
    directItems: Sample[];
  }> = [];

  for (const s of samples) {
    let group = groups.find((g) => g.name === s.group);
    if (!group) {
      group = { name: s.group, subgroups: [], directItems: [] };
      groups.push(group);
    }
    if (s.subgroup) {
      let sub = group.subgroups.find((sg) => sg.name === s.subgroup);
      if (!sub) {
        sub = { name: s.subgroup!, items: [] };
        group.subgroups.push(sub);
      }
      sub.items.push(s);
    } else {
      group.directItems.push(s);
    }
  }
  return groups;
}

export function SampleSidebar({
  samples,
  selectedId,
  onSelect,
}: {
  samples: Sample[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const tree = buildTree(samples);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Expand the group that contains the selected sample
    const selected = samples.find((s) => s.id === selectedId);
    return new Set(selected ? [selected.group] : [tree[0]?.name]);
  });
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(() => {
    const selected = samples.find((s) => s.id === selectedId);
    return new Set(selected?.subgroup ? [`${selected.group}/${selected.subgroup}`] : []);
  });

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSub = (key: string) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div
      style={{
        width: 260,
        borderRight: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        overflowY: "auto",
        flexShrink: 0,
        fontSize: 13,
      }}
    >
      {tree.map((group) => {
        const isExpanded = expandedGroups.has(group.name);
        const totalItems =
          group.directItems.length +
          group.subgroups.reduce((s, sg) => s + sg.items.length, 0);

        return (
          <div key={group.name}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.name)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.6 }}>
                {isExpanded ? "▼" : "▸"}
              </span>
              {group.name}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontWeight: 400,
                }}
              >
                {totalItems}
              </span>
            </button>

            {isExpanded && (
              <div>
                {/* Direct items (no subgroup) */}
                {group.directItems.map((s) => (
                  <SampleItem
                    key={s.id}
                    sample={s}
                    selected={s.id === selectedId}
                    indent={1}
                    onSelect={onSelect}
                  />
                ))}

                {/* Subgroups */}
                {group.subgroups.map((sub) => {
                  const subKey = `${group.name}/${sub.name}`;
                  const subExpanded = expandedSubs.has(subKey);

                  return (
                    <div key={subKey}>
                      <button
                        onClick={() => toggleSub(subKey)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 12px 5px 24px",
                          border: "none",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          fontSize: 12,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 9, opacity: 0.5 }}>
                          {subExpanded ? "▼" : "▸"}
                        </span>
                        {sub.name}
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 10,
                            color: "var(--text-muted)",
                          }}
                        >
                          {sub.items.length}
                        </span>
                      </button>
                      {subExpanded &&
                        sub.items.map((s) => (
                          <SampleItem
                            key={s.id}
                            sample={s}
                            selected={s.id === selectedId}
                            indent={2}
                            onSelect={onSelect}
                          />
                        ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SampleItem({
  sample,
  selected,
  indent,
  onSelect,
}: {
  sample: Sample;
  selected: boolean;
  indent: number;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(sample.id)}
      title={sample.description}
      style={{
        width: "100%",
        display: "block",
        padding: `4px 12px 4px ${12 + indent * 16}px`,
        border: "none",
        background: selected ? "var(--accent-bg, rgba(99,102,241,0.15))" : "transparent",
        color: selected ? "var(--accent, #6366f1)" : "var(--text-secondary)",
        fontSize: 13,
        cursor: "pointer",
        textAlign: "left",
        borderLeft: selected ? "2px solid var(--accent, #6366f1)" : "2px solid transparent",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {sample.name}
    </button>
  );
}

/** Mobile: grouped <select> with <optgroup> */
export function SampleDropdown({
  samples,
  selectedId,
  onSelect,
}: {
  samples: Sample[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const tree = buildTree(samples);

  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      style={{
        background: "var(--bg-tertiary)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 12,
        cursor: "pointer",
        outline: "none",
        flex: 1,
        minWidth: 0,
      }}
    >
      {tree.map((group) => {
        const options: ReactElement[] = [];

        // Direct items under group label
        if (group.directItems.length > 0) {
          options.push(
            <optgroup key={group.name} label={group.name}>
              {group.directItems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          );
        }

        // Subgroup items under "Group › Subgroup" label
        for (const sub of group.subgroups) {
          options.push(
            <optgroup key={`${group.name}/${sub.name}`} label={`${group.name} › ${sub.name}`}>
              {sub.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          );
        }

        return options;
      })}
    </select>
  );
}
