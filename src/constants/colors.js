// "Jharokha nights" palette.
//
// Indigo night (neel) for surfaces, marigold (genda) for anything you tap,
// warm cream for text instead of pure white (gentler on eyes in a dark room),
// and a little rose for warmth. Solid colours over glowing gradients — the
// app is used in the dark, at the end of the day.

const palette = {
  night900: "#08071C",
  night800: "#0D0C26",
  night700: "#131337",
  night600: "#1A1A47",
  night500: "#23235A",
  marigold: "#F5A524",
  marigoldSoft: "#FFCF7D",
  saffron: "#E9782F",
  cream: "#FFF3DE",
  rose: "#F2A7B8",
  ink: "#1C1004",
};

export const colors = {
  ...palette,

  // Background gradient stops (top → bottom)
  bgTop: "#100F30",
  bgMid1: "#131439",
  bgMid2: "#111234",
  bgBottom: palette.night800,

  // Surfaces — opaque, so stacked cards never go muddy
  card: palette.night700,
  cardRaised: palette.night600,
  chip: "rgba(255, 243, 222, 0.07)",
  chipBorder: "rgba(255, 243, 222, 0.10)",

  // Lines
  line: "rgba(255, 207, 125, 0.22)",
  lineSoft: "rgba(255, 243, 222, 0.08)",
  frameInset: "rgba(255, 207, 125, 0.38)",

  // Text (cream on night800: primary ≈ 15:1, tertiary ≈ 6.5:1)
  textPrimary: "rgba(255, 243, 222, 0.94)",
  textSecondary: "rgba(255, 243, 222, 0.74)",
  textTertiary: "rgba(255, 243, 222, 0.6)",
  onGold: palette.ink,

  // States
  error: "#FFB4A3",

  // Legacy names (older components) mapped onto the new palette
  gold: palette.marigold,
  goldLight: palette.marigoldSoft,
  orange: palette.saffron,
  white: palette.cream,
  borderGold: "rgba(255, 207, 125, 0.22)",
  borderGoldSubtle: "rgba(255, 207, 125, 0.14)",
  borderGoldFaint: "rgba(255, 207, 125, 0.08)",
  borderGoldMedium: "rgba(255, 207, 125, 0.28)",
};
