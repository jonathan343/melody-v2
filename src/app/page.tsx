"use client";

import Aurora from "../components/Aurora";
import { signIn } from "next-auth/react";
import Image from "next/image";

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
        <div className="flex items-center justify-center gap-6 mb-6">
          <Image
            src="/melody.png"
            alt="Melody Logo"
            width={96}
            height={96}
            className="p-2"
          />
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
            Melody
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover your music taste with AI-powered insights and personalized recommendations from your Spotify data.
        </p>
        <div className="flex justify-center">
          <button 
            onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
            className="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/40 hover:border-spotify-green/70 rounded-full text-white font-semibold hover:scale-105 transition-all duration-150 flex items-center justify-center gap-3 shadow-2xl shadow-white/10"
          >
            <Image 
              src="/spotify-logo-white.png" 
              alt="Spotify logo" 
              width={24} 
              height={24} 
              className="w-8 h-8"
            />
            Connect with Spotify
          </button>
        </div>
      </div>
    </div>
  );
}
