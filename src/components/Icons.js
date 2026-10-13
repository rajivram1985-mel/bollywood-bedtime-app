import Svg, { Path, Rect, Circle } from "react-native-svg";

// Small stroke/fill icon set so controls render identically on iOS, Android
// and web (emoji glyphs vary wildly between platforms).

const base = (size) => ({ width: size, height: size, viewBox: "0 0 24 24" });

export function PlayIcon({ size = 24, color = "#fff" }) {
  return (
    <Svg {...base(size)}>
      <Path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ size = 24, color = "#fff" }) {
  return (
    <Svg {...base(size)}>
      <Rect x={5.5} y={4} width={4.5} height={16} rx={1.4} fill={color} />
      <Rect x={14} y={4} width={4.5} height={16} rx={1.4} fill={color} />
    </Svg>
  );
}

function SkipArrow({ size, color, back }) {
  // Circular arrow with "15" implied by the caption under the button.
  return (
    <Svg {...base(size)}>
      <Path
        d={back ? "M12 5a7 7 0 1 1-6.6 4.7" : "M12 5a7 7 0 1 0 6.6 4.7"}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Path d={back ? "M12 2v6L8 5z" : "M12 2v6l4-3z"} fill={color} />
    </Svg>
  );
}

export const BackIcon = (p) => <SkipArrow size={p.size ?? 28} color={p.color ?? "#fff"} back />;
export const ForwardIcon = (p) => <SkipArrow size={p.size ?? 28} color={p.color ?? "#fff"} />;

export function ChevronDownIcon({ size = 24, color = "#fff" }) {
  return (
    <Svg {...base(size)}>
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MoonIcon({ size = 22, color = "#fff" }) {
  return (
    <Svg {...base(size)}>
      <Path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill={color} />
    </Svg>
  );
}

export function GearIcon({ size = 22, color = "#fff" }) {
  return (
    <Svg {...base(size)}>
      <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={1.8} fill="none" />
      <Path
        d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BookIcon({ size = 20, color = "#fff" }) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"
        stroke={color}
        strokeWidth={1.7}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = "#fff" }) {
  return (
    <Svg {...base(size)}>
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = "#fff" }) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
