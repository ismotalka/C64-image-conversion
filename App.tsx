import React, { useState, useRef, useEffect } from 'react';
import { PALETTES, Palette } from './utils/palettes';
import { processImage } from './utils/imageProcessor';
import { analyzeRetroImage } from './services/geminiService';
import { Upload, Monitor, Cpu, Save, Wand2, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>('c64');
  const [isProcessing, setIsProcessing] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dithering, setDithering] = useState(1.0);
  const [resolutionScale, setResolutionScale] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setOriginalImage(e.target.result as string);
          setProcessedImage(null);
          setGeminiAnalysis("");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerConversion = async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    
    // Load image into an offscreen image element to get dimensions
    const img = new Image();
    img.src = originalImage;
    await new Promise((resolve) => { img.onload = resolve; });

    const palette = PALETTES[selectedSystem];
    
    // Create a temporary canvas for resizing logic
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    if (!ctx) {
        setIsProcessing(false);
        return;
    }

    // Calculate Target Dimensions maintaining aspect ratio
    // We restrict the width based on the retro system's typical width (e.g. 320px)
    // multiplied by user preference scale
    const targetWidth = Math.floor((palette.maxWidth || 320) * resolutionScale);
    const aspectRatio = img.height / img.width;
    const targetHeight = Math.floor(targetWidth * aspectRatio);

    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;

    // Draw and resize (naive sampling, browser default)
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Process pixel-by-pixel
    const resultDataUrl = await processImage(tempCanvas, palette, dithering);
    setProcessedImage(resultDataUrl);
    setIsProcessing(false);
    setGeminiAnalysis("");
  };

  const handleAnalysis = async () => {
    if (!processedImage) return;
    setIsAnalyzing(true);
    const analysis = await analyzeRetroImage(processedImage, PALETTES[selectedSystem].name);
    setGeminiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `retro-${selectedSystem}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
         <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-500 rounded-full blur-[100px]"></div>
      </div>

      <header className="z-10 text-center mb-8">
        <h1 className="text-5xl font-retro text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)] mb-2">
          RETROVISION CONVERTER
        </h1>
        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">
          Advanced Neural & Algorithmic Image Downgrading
        </p>
      </header>

      <main className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 p-6 rounded-lg shadow-2xl flex flex-col gap-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source Input</label>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-neutral-700 rounded hover:border-green-500 hover:bg-neutral-800 transition-colors flex flex-col items-center gap-2 group"
            >
              <Upload className="text-neutral-500 group-hover:text-green-400" size={24} />
              <span className="text-neutral-400 group-hover:text-white text-sm font-medium">Upload Image</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          {originalImage && (
            <>
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                   <Monitor size={14} /> Target System
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(PALETTES).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedSystem(key)}
                      className={`px-4 py-3 text-left font-mono text-sm border rounded transition-all duration-200 ${
                        selectedSystem === key 
                        ? 'border-green-500 bg-green-900/20 text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]' 
                        : 'border-neutral-700 text-gray-400 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{PALETTES[key].name}</span>
                        <div className="flex gap-1">
                            {PALETTES[key].colors.slice(0,4).map((c, i) => (
                                <div key={i} className="w-2 h-2 rounded-full" style={{backgroundColor: `rgb(${c.r},${c.g},${c.b})`}}></div>
                            ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-neutral-800 pt-4">
                <div>
                    <div className="flex justify-between mb-1">
                         <label className="text-xs font-bold text-gray-500 uppercase">Dithering</label>
                         <span className="text-xs text-green-400 font-mono">{Math.round(dithering * 100)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="1.2" 
                        step="0.1" 
                        value={dithering} 
                        onChange={(e) => setDithering(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-1">
                         <label className="text-xs font-bold text-gray-500 uppercase">Resolution Scale</label>
                         <span className="text-xs text-green-400 font-mono">{resolutionScale}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="3" 
                        step="0.5" 
                        value={resolutionScale} 
                        onChange={(e) => setResolutionScale(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>
              </div>

              <button 
                onClick={triggerConversion}
                disabled={isProcessing}
                className={`w-full py-3 font-bold text-black uppercase tracking-wider rounded flex justify-center items-center gap-2 shadow-lg ${
                  isProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 hover:shadow-[0_0_15px_rgba(74,222,128,0.6)]'
                }`}
              >
                 {isProcessing ? <Cpu className="animate-spin" /> : <Cpu />}
                 {isProcessing ? 'Processing...' : 'Initialize Convert'}
              </button>
            </>
          )}
        </div>

        {/* Main Viewport */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {/* Viewport Area */}
          <div className="relative bg-black rounded-lg border-4 border-neutral-800 shadow-2xl overflow-hidden min-h-[400px] flex items-center justify-center group">
             <div className="scanlines"></div>
             
             {!originalImage && (
                 <div className="text-center text-neutral-700 flex flex-col items-center">
                    <Monitor size={64} className="mb-4 opacity-20" />
                    <p className="font-retro text-2xl">SYSTEM STANDBY</p>
                    <p className="font-mono text-xs">Waiting for media input...</p>
                 </div>
             )}

             {originalImage && !processedImage && !isProcessing && (
                <img src={originalImage} alt="Original" className="max-w-full max-h-[600px] object-contain opacity-50 grayscale" />
             )}

             {isProcessing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                    <div className="w-64 h-4 bg-neutral-800 rounded border border-neutral-700 overflow-hidden">
                        <div className="h-full bg-green-500 animate-[loading_1s_ease-in-out_infinite]"></div>
                    </div>
                    <p className="mt-4 font-retro text-green-400 animate-pulse">COMPUTING PALETTES...</p>
                 </div>
             )}

             {processedImage && (
                 <img 
                    src={processedImage} 
                    alt="Processed" 
                    className="max-w-full max-h-[600px] object-contain image-pixelated relative z-0" 
                    style={{imageRendering: 'pixelated'}} // Critical for retro look
                 />
             )}
          </div>

          {/* Action Bar (Post-process) */}
          {processedImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
               
               {/* Gemini Insights */}
               <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-purple-400 font-bold font-mono flex items-center gap-2">
                        <Terminal size={16} />
                        AI RETROSPECTIVE
                    </h3>
                    <button 
                        onClick={handleAnalysis}
                        disabled={isAnalyzing}
                        className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-800 hover:bg-purple-800/50 transition-colors"
                    >
                        {isAnalyzing ? 'Consulting Oracle...' : 'Analyze Output'}
                    </button>
                  </div>
                  <div className="bg-black p-3 rounded border border-neutral-800 min-h-[80px] font-retro text-lg text-gray-300 leading-tight">
                      {isAnalyzing ? (
                          <span className="animate-pulse">_ Connecting to Gemini mainframe...</span>
                      ) : geminiAnalysis ? (
                          <span className="typing-effect">{geminiAnalysis}</span>
                      ) : (
                          <span className="text-gray-600">_ Ready to analyze graphic fidelity.</span>
                      )}
                  </div>
               </div>

               {/* Actions */}
               <div className="flex flex-col justify-center gap-3">
                   <button 
                     onClick={downloadImage}
                     className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-mono border border-neutral-600 rounded flex items-center justify-center gap-3 transition-all"
                   >
                      <Save size={20} />
                      <span>SAVE TO DISK</span>
                   </button>
                   
                   <div className="text-center">
                       <p className="text-xs text-gray-600 font-mono">Format: PNG • {PALETTES[selectedSystem].colors.length} Colors • Dithering: {(dithering*100).toFixed(0)}%</p>
                   </div>
               </div>

            </div>
          )}
        </div>

      </main>
      
      <style>{`
        @keyframes loading {
            0% { width: 0% }
            50% { width: 70% }
            100% { width: 100% }
        }
      `}</style>
    </div>
  );
};

export default App;