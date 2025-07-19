"use client";

import Aurora from "../components/Aurora";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#00dbde", "#7209b7", "#fc00ff"]}
          rotationSpeed={0.75}
          gradientIntensity={1.0}
          gradientSize={1.2}
          turbulence={0.25}
          pulsing={0.000}
          speed={1.0}
        />
      </div>
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
          Melody
        </h1>
        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          Experience the harmony of sound and light with beautiful aurora effects
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-all duration-200">
            Get Started
          </button>
          <button className="px-8 py-4 bg-transparent border border-white/30 rounded-full text-white font-medium hover:border-white/50 transition-all duration-200">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
