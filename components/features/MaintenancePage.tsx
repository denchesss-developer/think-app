"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { MoreVertical, X, User } from "lucide-react";

// URL for World Atlas data
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Floating pins data
const pins = [
  { id: 1, text: "3", icon: "🌱", top: "22%", left: "25%", delay: 0 },
  { id: 2, text: "6", icon: "🌳", top: "45%", left: "68%", delay: 1.5 },
  { id: 3, text: "7", icon: "🌿", top: "60%", left: "20%", delay: 0.8 },
  { id: 4, text: "2", icon: "🌱", top: "72%", left: "55%", delay: 2.2 },
  { id: 5, text: "5", icon: "🌳", top: "18%", left: "60%", delay: 0.5 },
];

/**
 * GlobeVisual Component
 */
function GlobeVisual() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (time: number) => {
      const delta = time - lastTime;
      // Rotate ~5 degrees per second
      setRotation((prev) => (prev + delta * 0.005) % 360);
      lastTime = time;
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 mx-auto my-2 md:my-12">
      {/* 3D Rotating Globe */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gray-50 to-white overflow-hidden shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.03),_0_20px_40px_rgba(0,0,0,0.05)] border border-gray-100/50 flex items-center justify-center">
        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{
            rotate: [-rotation, -15, 0], // Tilt slightly down, rotate around Y
            scale: 200,
          }}
          width={400}
          height={400}
          style={{ width: "100%", height: "100%", outline: "none" }}
        >
          {/* Graticule for the globe grid look */}
          <Graticule stroke="#e5e7eb" strokeWidth={0.5} opacity={0.5} />
          
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#bfdbfe" // Tailwnd blue-200
                  stroke="#93c5fd" // Tailwind blue-300
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#93c5fd" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Outer Sphere Stroke */}
          <Sphere stroke="#e5e7eb" strokeWidth={1} id="sphere" fill="transparent" />
        </ComposableMap>
      </div>

      {/* Spherical Shading Overlay to enhance 3D volume */}
      <div className="absolute inset-0 rounded-full shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.04),_inset_10px_10px_20px_rgba(255,255,255,0.9)] pointer-events-none z-10" />

      {/* Floating Pins */}
      {pins.map((pin) => (
        <motion.div
          key={pin.id}
          className="absolute z-20 flex items-center justify-center gap-1.5 px-3 h-8 md:h-10 rounded-full bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100/50 text-sm font-medium text-gray-700 backdrop-blur-sm whitespace-nowrap"
          style={{ top: pin.top, left: pin.left }}
          animate={{
            y: [-8, 8, -8],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: pin.delay,
          }}
        >
          <span className="font-semibold">{pin.text}</span>
          <span className="text-base leading-none">{pin.icon}</span>
        </motion.div>
      ))}

      {/* Subtle Glow beneath */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-blue-100/30 blur-xl rounded-full mix-blend-multiply pointer-events-none" />
    </div>
  );
}

interface MaintenancePageProps {
  onAuthorized: () => void;
}

/**
 * MaintenancePage Component
 */
export default function MaintenancePage({ onAuthorized }: MaintenancePageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "think1234") {
      onAuthorized();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#ffffff] flex flex-col items-center justify-between font-sans px-6 relative py-8 md:py-20 lg:py-24">
      {/* Beta Access Trigger */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowLogin(!showLogin)}
          className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Beta Login Overlay */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-4 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6"
          >
            <div className="flex justify-center items-center gap-2 mb-4">
              <User size={18} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase">utenti beta tester</h3>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci password"
                className={`w-full px-4 py-2 text-sm text-black border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  error ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Accedi
              </button>
              {error && (
                <p className="text-center text-xs text-red-500 font-medium">Password errata</p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl w-full flex-1 flex flex-col items-center justify-center text-center min-h-0">
        {/* Entrance Animation Wrap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center w-full"
        >
          {/* Header */}
          <h1 className="text-[2.25rem] md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-2 md:mb-6 px-4 whitespace-nowrap">
            Benvenuto su <span className="text-blue-600">Think.</span>
          </h1>

          {/* Description Block */}
          <p className="text-[1rem] md:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-xl mx-auto mb-4 md:mb-6">
            Think è un sito di messaggistica globale in totale anonimato. 
            Nessun profilo, nessuna bio, nessuna foto, nessun follower. 
            Parla di politica, dei tuoi sogni, dei tuoi traumi. 
            Comunica davvero come la pensi. 
            La tua unica identità è il tuo <strong className="font-semibold text-gray-800">Thinkname</strong>.
          </p>

          {/* Core Visual */}
          <div className="scale-100 sm:scale-110 md:scale-110 lg:scale-125 mt-8 mb-4 md:my-0 transition-transform duration-500">
            <GlobeVisual />
          </div>

          {/* PC Status Area (Visible only on desktop) */}
          <div className="hidden md:flex mt-4 lg:mt-8">
            <StatusBadge />
          </div>
        </motion.div>
      </main>

      {/* Mobile Footer Area (Visible only on mobile) */}
      <footer className="md:hidden mt-auto py-2">
        <StatusBadge />
      </footer>
    </div>
  );
}

/**
 * StatusBadge Component
 */
function StatusBadge() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-gray-50/80 border border-gray-100 rounded-full px-6 py-2.5 shadow-sm inline-flex items-center space-x-3 transform scale-90 md:scale-100"
    >
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
      <span className="text-[0.875rem] md:text-sm font-medium text-gray-700 tracking-wide uppercase">
        L&apos;accesso sarà disponibile a breve.
      </span>
    </motion.div>
  );
}
