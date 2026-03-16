type IconPaths = readonly [string, string, string];
type IconOpacity = readonly [number, number, number];

interface IconDef {
  opacity: IconOpacity;
  paths: IconPaths;
}

export const ICONS = {
  cross: {
    opacity: [1, 1, 0],
    paths: [
      "M9.82843 4.17157L4.17157 9.82843",
      "M4.17157 4.17157L9.82843 9.82843",
      "M7 7L7 7",
    ],
  },
  menu: {
    opacity: [1, 1, 1],
    paths: ["M2.5 4L11.5 4", "M2.5 7L11.5 7", "M2.5 10L11.5 10"],
  },
} as const satisfies Record<string, IconDef>;

export type MorphIconName = keyof typeof ICONS;
