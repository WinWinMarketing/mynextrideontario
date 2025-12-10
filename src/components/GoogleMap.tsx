'use client';

import { useEffect, useRef, useState } from 'react';

// Main GTA Service Area - follows actual boundaries along the lake
const SERVICE_AREA_POLYGON = [
  // Start North, go clockwise
  { lat: 44.08, lng: -79.55 },  // North Newmarket
  { lat: 44.05, lng: -79.35 },  // East Gwillimbury
  { lat: 44.00, lng: -79.15 },  // Georgina/Uxbridge
  { lat: 43.95, lng: -78.85 },  // North Oshawa
  { lat: 43.90, lng: -78.80 },  // Oshawa
  { lat: 43.85, lng: -78.82 },  // South Oshawa
  // Follow lakeshore (staying on land)
  { lat: 43.82, lng: -78.90 },  // Whitby
  { lat: 43.80, lng: -79.00 },  // Ajax
  { lat: 43.77, lng: -79.08 },  // Pickering
  { lat: 43.72, lng: -79.18 },  // Scarborough East
  { lat: 43.68, lng: -79.28 },  // Scarborough
  { lat: 43.65, lng: -79.38 },  // Toronto East
  { lat: 43.635, lng: -79.42 }, // Downtown Toronto
  { lat: 43.62, lng: -79.48 },  // Toronto West
  { lat: 43.59, lng: -79.54 },  // Etobicoke
  { lat: 43.56, lng: -79.60 },  // Mississauga East
  { lat: 43.52, lng: -79.64 },  // Port Credit
  { lat: 43.48, lng: -79.68 },  // South Mississauga
  { lat: 43.45, lng: -79.70 },  // Oakville border
  // West boundary - STOPS before Brampton
  { lat: 43.52, lng: -79.72 },
  { lat: 43.60, lng: -79.70 },
  { lat: 43.68, lng: -79.68 },  // West boundary line
  // North through Vaughan (avoiding Brampton)
  { lat: 43.78, lng: -79.62 },  // Woodbridge
  { lat: 43.85, lng: -79.58 },  // Vaughan
  { lat: 43.92, lng: -79.55 },  // King City
  { lat: 44.00, lng: -79.52 },  // Aurora West
  { lat: 44.08, lng: -79.55 },  // Back to start
];

// Brampton - excluded area (red)
const BRAMPTON_POLYGON = [
  { lat: 43.82, lng: -79.95 },  // NW
  { lat: 43.82, lng: -79.68 },  // NE
  { lat: 43.60, lng: -79.68 },  // SE
  { lat: 43.60, lng: -79.95 },  // SW
];

export function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || isLoaded) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Prevent duplicate loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initServiceMap`;
    script.async = true;
    script.defer = true;

    (window as any).initServiceMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.72, lng: -79.40 },
          zoom: 9,
          mapTypeId: 'roadmap',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8c8dc' }] },
            { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f5f7fa' }] },
            { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
            { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e0e4e8' }] },
            { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }, { weight: 0.5 }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
          scrollwheel: false,
          gestureHandling: 'cooperative',
        });

        // Draw INCLUDED service area (green)
        new google.maps.Polygon({
          paths: SERVICE_AREA_POLYGON,
          strokeColor: '#16a34a',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#22c55e',
          fillOpacity: 0.20,
          map,
        });

        // Draw EXCLUDED Brampton area (red)
        new google.maps.Polygon({
          paths: BRAMPTON_POLYGON,
          strokeColor: '#dc2626',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#ef4444',
          fillOpacity: 0.30,
          map,
        });

        // Add "Brampton" label
        new google.maps.Marker({
          position: { lat: 43.71, lng: -79.82 },
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 0,
          },
          label: {
            text: 'BRAMPTON',
            color: '#dc2626',
            fontSize: '11px',
            fontWeight: 'bold',
          },
        });

        // Legend
        const legend = document.createElement('div');
        legend.innerHTML = `
          <div style="background: white; padding: 14px 18px; margin: 12px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.12); font-family: system-ui, sans-serif; font-size: 13px;">
            <div style="font-weight: 700; margin-bottom: 10px; color: #0f172a;">Service Area</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="width: 20px; height: 12px; background: rgba(34,197,94,0.3); border: 2px solid #16a34a; border-radius: 2px;"></span>
              <span style="color: #16a34a; font-weight: 500;">We Serve This Area</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 20px; height: 12px; background: rgba(239,68,68,0.35); border: 2px solid #dc2626; border-radius: 2px;"></span>
              <span style="color: #dc2626; font-weight: 500;">Not Served (Brampton)</span>
            </div>
          </div>
        `;
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

        setIsLoaded(true);
      } catch (err) {
        console.error('Map error:', err);
        setError('Failed to load map');
      }
    };

    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      delete (window as any).initServiceMap;
    };
  }, [isLoaded]);

  if (error) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-xl">
        <div className="text-center p-8">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-slate-600 font-medium">{error}</p>
          <p className="text-slate-400 text-sm mt-2">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to Vercel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[500px] rounded-xl" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
