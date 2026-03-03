
"use client"

import { useEffect, useRef } from "react"
import { MapPin, User, Navigation } from "lucide-react"

interface OperationsMapProps {
  riders: any[]
  orders: any[]
}

export function OperationsMap({ riders, orders }: OperationsMapProps) {
  // Logic to determine most recent pending destination
  const latestPending = orders.find(o => o.status === 'pending')

  return (
    <div className="relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
      {/* 
          Mock Map Visualization 
          In a production app, integrate Google Maps/Leaflet here.
          We use a stylized abstract grid for the Mission Control feel.
      */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#8B5CF6 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} 
      />
      
      <div className="relative w-full h-full p-8 flex flex-col items-center justify-center gap-4">
        {/* Radar effect */}
        <div className="absolute w-[300px] h-[300px] border border-primary/20 rounded-full animate-pulse" />
        <div className="absolute w-[200px] h-[200px] border border-primary/30 rounded-full animate-pulse delay-75" />
        
        <div className="z-10 text-center space-y-2">
           <Navigation className="h-8 w-8 text-primary mx-auto animate-bounce" />
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Operations View</p>
        </div>

        {/* Dynamic Pins Information */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
            <span>Online Assets</span>
            <span className="text-primary">{riders.length} Riders</span>
          </div>
          <div className="flex gap-2">
            {riders.map((r, i) => (
              <div key={i} className="h-1.5 flex-1 bg-primary/40 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[loading_2s_infinite]" />
              </div>
            ))}
          </div>
          {latestPending && (
             <div className="pt-1 border-t flex items-center gap-2">
                <MapPin className="h-3 w-3 text-accent" />
                <span className="text-[10px] text-slate-600 truncate">
                  Latest Target: {latestPending.deliveryLocation?.address || latestPending.customerName}
                </span>
             </div>
          )}
        </div>

        {/* Mock Pins */}
        {riders.map((_, i) => (
          <div 
            key={i} 
            className="absolute p-1 bg-primary rounded-full shadow-lg border-2 border-white animate-in zoom-in"
            style={{ 
              top: `${20 + (i * 15)}%`, 
              left: `${30 + (i * 20)}%` 
            }}
          >
            <User className="h-3 w-3 text-white" />
          </div>
        ))}
        
        {latestPending && (
          <div 
            className="absolute p-1 bg-accent rounded-full shadow-xl border-2 border-white animate-bounce"
            style={{ top: '40%', right: '25%' }}
          >
            <MapPin className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
