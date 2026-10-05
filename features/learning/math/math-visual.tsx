import type { Visual } from "./content";

function polar(angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: 120 + 86 * Math.cos(radians), y: 120 + 86 * Math.sin(radians) };
}
function sector(index: number, parts: number) {
  const start = polar((index * 360) / parts);
  const end = polar(((index + 1) * 360) / parts);
  return `M 120 120 L ${start.x} ${start.y} A 86 86 0 ${parts === 1 ? 1 : 360 / parts > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
}

export function MathVisual({ visual }: { visual: Visual }) {
  if (visual.type === "grouped_objects")
    return (
      <div className="visual-content">
        <div
          className="group-grid"
          aria-label={`${visual.groups} kelompok, masing-masing ${visual.perGroup} benda`}
        >
          {Array.from({ length: visual.groups }, (_, group) => (
            <div className="object-group" key={group}>
              <span className="group-caption">Kelompok {group + 1}</span>
              <span className="object-items">
                {Array.from({ length: visual.perGroup }, (_, item) => (
                  <span key={item} aria-hidden="true">
                    {visual.emoji}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
        <p className="visual-label">
          {visual.groups} kelompok × {visual.perGroup} benda
        </p>
      </div>
    );
  return (
    <div className="visual-content">
      <svg
        className="fraction-svg"
        viewBox="0 0 240 240"
        role="img"
        aria-label={`${visual.selected} dari ${visual.parts} bagian dipilih`}
      >
        {visual.parts === 1 ? (
          <circle
            cx="120"
            cy="120"
            r="86"
            fill="#A855F7"
            stroke="#7E22CE"
            strokeWidth="3"
          />
        ) : (
          Array.from({ length: visual.parts }, (_, index) => (
            <path
              key={index}
              d={sector(index, visual.parts)}
              fill={index < visual.selected ? "#A855F7" : "#FFF1EA"}
              stroke="#7E22CE"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ))
        )}
        <circle
          cx="120"
          cy="120"
          r="87"
          fill="none"
          stroke="#7E22CE"
          strokeWidth="3"
        />
      </svg>
      <p className="visual-label">
        {visual.label ?? `${visual.selected} dari ${visual.parts} bagian`}
      </p>
    </div>
  );
}
