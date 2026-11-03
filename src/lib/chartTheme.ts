import { Theme } from "@mui/material/styles";

/** BEXRUZ grafik palitrasi: asosiy rang qizil, qolganlari bosiq tonlar */
export const BX_RED = "#e11d2e";

export const categoryColors: Record<string, string> = {
  DISH: "#e11d2e",
  DRINK: "#f59e0b",
  SALAD: "#16a34a",
  DESSERT: "#a1a1aa",
  OTHER: "#52525b",
};

/** Theme ga mos o'q, to'r va matn ranglari */
export function chartColors(theme: Theme) {
  const dark = theme.palette.mode === "dark";
  return {
    text: dark ? "#a1a1aa" : "#5b5b63",
    grid: dark ? "rgba(255,255,255,0.06)" : "rgba(10,10,11,0.06)",
    surface: theme.palette.background.paper,
    font: { family: theme.typography.fontFamily as string, weight: 600 as const },
  };
}
