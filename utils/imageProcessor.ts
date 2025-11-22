import { RGB, Palette } from './palettes';

// Helper to calculate Euclidean distance squared between two colors
const colorDistanceSq = (c1: RGB, c2: RGB) => {
  return (c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2;
};

// Find the nearest color in the palette
const findNearestColor = (color: RGB, palette: RGB[]): RGB => {
  let minDist = Infinity;
  let nearest = palette[0];

  for (let i = 0; i < palette.length; i++) {
    const dist = colorDistanceSq(color, palette[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = palette[i];
    }
  }
  return nearest;
};

// Main processing function
export const processImage = (
  sourceCanvas: HTMLCanvasElement,
  targetPalette: Palette,
  ditheringStrength: number = 1.0
): Promise<string> => {
  return new Promise((resolve) => {
    // Simulate processing delay for "weight" if needed, but usually purely synchronous logic inside timeout is best to unblock UI
    setTimeout(() => {
      const ctx = sourceCanvas.getContext('2d');
      if (!ctx) return resolve("");

      const width = sourceCanvas.width;
      const height = sourceCanvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const paletteColors = targetPalette.colors;

      // Floyd-Steinberg Dithering
      // Loop through every pixel
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;

          const oldR = data[i];
          const oldG = data[i + 1];
          const oldB = data[i + 2];

          const nearest = findNearestColor({ r: oldR, g: oldG, b: oldB }, paletteColors);

          data[i] = nearest.r;
          data[i + 1] = nearest.g;
          data[i + 2] = nearest.b;

          const errR = (oldR - nearest.r) * ditheringStrength;
          const errG = (oldG - nearest.g) * ditheringStrength;
          const errB = (oldB - nearest.b) * ditheringStrength;

          // Distribute error to neighbors
          // Pixel[x+1][y] += 7/16
          if (x + 1 < width) {
            const ni = (y * width + (x + 1)) * 4;
            data[ni] = Math.min(255, Math.max(0, data[ni] + (errR * 7) / 16));
            data[ni + 1] = Math.min(255, Math.max(0, data[ni + 1] + (errG * 7) / 16));
            data[ni + 2] = Math.min(255, Math.max(0, data[ni + 2] + (errB * 7) / 16));
          }

          // Pixel[x-1][y+1] += 3/16
          if (x - 1 >= 0 && y + 1 < height) {
            const ni = ((y + 1) * width + (x - 1)) * 4;
            data[ni] = Math.min(255, Math.max(0, data[ni] + (errR * 3) / 16));
            data[ni + 1] = Math.min(255, Math.max(0, data[ni + 1] + (errG * 3) / 16));
            data[ni + 2] = Math.min(255, Math.max(0, data[ni + 2] + (errB * 3) / 16));
          }

          // Pixel[x][y+1] += 5/16
          if (y + 1 < height) {
            const ni = ((y + 1) * width + x) * 4;
            data[ni] = Math.min(255, Math.max(0, data[ni] + (errR * 5) / 16));
            data[ni + 1] = Math.min(255, Math.max(0, data[ni + 1] + (errG * 5) / 16));
            data[ni + 2] = Math.min(255, Math.max(0, data[ni + 2] + (errB * 5) / 16));
          }

          // Pixel[x+1][y+1] += 1/16
          if (x + 1 < width && y + 1 < height) {
            const ni = ((y + 1) * width + (x + 1)) * 4;
            data[ni] = Math.min(255, Math.max(0, data[ni] + (errR * 1) / 16));
            data[ni + 1] = Math.min(255, Math.max(0, data[ni + 1] + (errG * 1) / 16));
            data[ni + 2] = Math.min(255, Math.max(0, data[ni + 2] + (errB * 1) / 16));
          }
        }
      }

      // Create a new canvas to return the data URL
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = width;
      resultCanvas.height = height;
      const resultCtx = resultCanvas.getContext('2d');
      resultCtx?.putImageData(imageData, 0, 0);
      
      resolve(resultCanvas.toDataURL('image/png'));
    }, 100); // Short delay to allow UI to render loading state
  });
};