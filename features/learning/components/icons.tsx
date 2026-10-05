import type { SVGProps } from "react";

type IconName =
  | "home"
  | "book"
  | "sound"
  | "stop"
  | "settings"
  | "arrow"
  | "back"
  | "spark"
  | "clock"
  | "check"
  | "play"
  | "star";

const paths: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H21" />
      <path d="M6.5 2H21v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h9M8 11h7" />
    </>
  ),
  sound: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  stop: <rect x="5" y="5" width="14" height="14" rx="2" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.2 2.2-.07-.06A1.7 1.7 0 0 0 15.6 19l-.08.03V22h-3.1v-.08A1.7 1.7 0 0 0 11 20.4l-.05-.02-1.7.7-1.55-2.7.06-.05A1.7 1.7 0 0 0 8 16.4L7.97 16H5v-3.1h.08A1.7 1.7 0 0 0 6.6 11.5l.02-.05-.7-1.7 2.7-1.55.05.06A1.7 1.7 0 0 0 10.6 8l.4-.03V5h3.1v.08A1.7 1.7 0 0 0 15.5 6.6l.05.02 1.7-.7 1.55 2.7-.06.05A1.7 1.7 0 0 0 18.4 10.6l.03.4H21v3.1h-.08A1.7 1.7 0 0 0 19.4 15z" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  back: (
    <>
      <path d="M19 12H5m6 6-6-6 6-6" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8zM19 18l.6 1.4L21 20l-1.4.6L19 22l-.6-1.4L17 20l1.4-.6z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="m4 12 5 5L20 6" />,
  play: <path d="m8 5 11 7-11 7z" />,
  star: (
    <path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1z" />
  ),
};

export function Icon({
  name,
  size = 20,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
