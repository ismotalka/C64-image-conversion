export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Palette {
  name: string;
  colors: RGB[];
  description: string;
  maxWidth?: number; // Typical horizontal resolution
}

const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const C64_PALETTE: RGB[] = [
  "#000000", "#FFFFFF", "#880000", "#AAFFEE",
  "#CC44CC", "#00CC55", "#0000AA", "#EEEE77",
  "#DD8855", "#664400", "#FF7777", "#333333",
  "#777777", "#AAFF66", "#0088FF", "#BBBBBB"
].map(hexToRgb);

export const EGA_PALETTE: RGB[] = [
  "#000000", "#0000AA", "#00AA00", "#00AAAA",
  "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA",
  "#555555", "#5555FF", "#55FF55", "#55FFFF",
  "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF"
].map(hexToRgb);

// Standard Amiga Workbench 1.3ish / 32 color default set approximation
export const AMIGA_PALETTE: RGB[] = [
  "#AAA", "#000", "#FFF", "#68B", "#F00", "#0F0", "#00F", "#FF0",
  "#0FF", "#F0F", "#888", "#444", "#E80", "#E08", "#80E", "#08E",
  "#400", "#040", "#004", "#440", "#044", "#404", "#840", "#804",
  "#084", "#048", "#480", "#408", "#FB0", "#DB4", "#B84", "#962"
].map(c => {
  // Expand shorthand hex if necessary (simple logic for full hexes used mostly)
  if(c.length === 4) {
     return hexToRgb(`#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`);
  }
  return hexToRgb(c);
});

// VGA Mode 13h default palette (first 64 are gradients, then standard colors)
// We will generate a standard 256 color VGA-ish palette
const generateVgaPalette = (): RGB[] => {
    const colors: RGB[] = [];
    // Add standard 16 colors
    colors.push(...EGA_PALETTE); 
    // Generate a color cube 6x6x6 = 216 colors
    for (let r = 0; r < 6; r++) {
        for (let g = 0; g < 6; g++) {
            for (let b = 0; b < 6; b++) {
                colors.push({
                    r: r * 51,
                    g: g * 51,
                    b: b * 51
                });
            }
        }
    }
    return colors;
};

export const VGA_PALETTE = generateVgaPalette();

// Atari 2600 NTSC Palette (subset)
export const ATARI_PALETTE: RGB[] = [
    "#000000", "#2D2D2D", "#585858", "#8C8C8C", "#BCBCBC", "#FFFFFF",
    "#3C3C00", "#6C6C00", "#989800", "#C0C000", "#E0E000",
    "#442800", "#744800", "#A06800", "#CC8400", "#F4A400",
    "#541400", "#882C00", "#B44800", "#E06800", "#FC8800",
    "#500000", "#800000", "#AC0000", "#D80000", "#FC0000",
    "#440038", "#70005C", "#980080", "#C000A8", "#E400D0",
    "#280048", "#4C0078", "#6C00A4", "#8C00D0", "#AC00FC",
    "#080050", "#1C0084", "#3400B0", "#4C00E0", "#6800FC",
    "#000050", "#000084", "#0000B0", "#0000E0", "#0000FC",
    "#001048", "#002478", "#003CB0", "#0054E0", "#006CFC",
    "#001C38", "#003864", "#005490", "#0070C0", "#008CFC",
    "#00281C", "#004C38", "#007054", "#009474", "#00B894",
    "#002800", "#004C00", "#006C00", "#008C00", "#00AC00",
    "#102800", "#284C00", "#406C00", "#5C8C00", "#78AC00",
    "#242400", "#484800", "#686800", "#888800", "#ACAC00"
].map(hexToRgb);

export const PALETTES: Record<string, Palette> = {
  c64: { name: "Commodore 64", colors: C64_PALETTE, description: "16 colors, High contrast", maxWidth: 320 },
  amiga: { name: "Amiga OCS", colors: AMIGA_PALETTE, description: "32 vibrant colors", maxWidth: 320 },
  ega: { name: "IBM EGA", colors: EGA_PALETTE, description: "16 colors, Digital signal", maxWidth: 640 },
  vga: { name: "IBM VGA", colors: VGA_PALETTE, description: "256 colors Mode 13h", maxWidth: 320 },
  atari: { name: "Atari 2600", colors: ATARI_PALETTE, description: "128 color NTSC palette", maxWidth: 160 },
};