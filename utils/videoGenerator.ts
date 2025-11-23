
import { Palette } from './palettes';

export const recordLoadingVideo = (
    imageSrc: string,
    durationMs: number = 6000,
    blockSize: number = 8
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        
        img.onload = () => {
            const width = img.width;
            const height = img.height;
            
            // Variable Block Size Logic (default 8x8 for C64 style)
            const BLOCK_SIZE = blockSize;
            const blocksX = Math.ceil(width / BLOCK_SIZE);
            // Unused but useful for calculation context
            // const blocksY = Math.ceil(height / BLOCK_SIZE);
            const totalBlocks = Math.ceil(width / BLOCK_SIZE) * Math.ceil(height / BLOCK_SIZE);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject("Could not create canvas context");
                return;
            }

            // Fill background with standard retro black
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, height);

            // Get source data from a temporary canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;
            tempCtx.drawImage(img, 0, 0);
            
            // Setup Recorder
            // @ts-ignore - captureStream is experimental in some type definitions
            const stream = canvas.captureStream(60); // Target 60 FPS video file
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            });
            
            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                resolve(url);
            };

            mediaRecorder.start();

            // Time-based animation for consistent speed across devices
            const startTime = performance.now();
            let renderedBlocks = 0;

            const animate = () => {
                const now = performance.now();
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / durationMs);
                
                const targetBlocks = Math.floor(totalBlocks * progress);
                
                // Draw all blocks needed to catch up to current time
                for (let i = renderedBlocks; i < targetBlocks; i++) {
                    const bx = i % blocksX;
                    const by = Math.floor(i / blocksX);
                    
                    const sx = bx * BLOCK_SIZE;
                    const sy = by * BLOCK_SIZE;
                    
                    // Calculate dimensions
                    const w = Math.min(BLOCK_SIZE, width - sx);
                    const h = Math.min(BLOCK_SIZE, height - sy);

                    // Blit the block
                    ctx.drawImage(tempCanvas, sx, sy, w, h, sx, sy, w, h);
                }

                renderedBlocks = targetBlocks;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure final frame is captured before stopping
                    setTimeout(() => mediaRecorder.stop(), 100);
                }
            };

            animate();
        };
        
        img.onerror = (err) => reject(err);
    });
};
