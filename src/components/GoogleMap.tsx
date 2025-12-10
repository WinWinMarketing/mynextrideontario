'use client';

import { useEffect, useRef, useState } from 'react';

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

    if (document.querySelector('script[src*="maps.googleapis.com"]')) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initServiceMap`;
    script.async = true;

    (window as any).initServiceMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.65, lng: -79.38 },
          zoom: 9.5,
          mapTypeId: 'roadmap',
          styles: [
            { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -20 }, { lightness: 20 }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a3c5d9' }] },
            { featureType: 'landscape', stylers: [{ color: '#fafafa' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffffff' }, { weight: 0.8 }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }, { weight: 0.5 }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
          scrollwheel: false,
          gestureHandling: 'cooperative',
        });

        // Precise GTA boundary (following the actual shoreline and avoiding Brampton)
        const gtaBoundary = new google.maps.Polygon({
          paths: [
            // North boundary
            { lat: 44.05, lng: -79.55 },
            { lat: 44.05, lng: -79.00 },
            // East - Oshawa
            { lat: 43.92, lng: -78.82 },
            { lat: 43.87, lng: -78.84 },
            { lat: 43.82, lng: -78.88 },
            // Southeast shoreline
            { lat: 43.78, lng: -78.98 },
            { lat: 43.72, lng: -79.08 },
            { lat: 43.68, lng: -79.20 },
            { lat: 43.65, lng: -79.32 },
            { lat: 43.635, lng: -79.40 }, // Toronto waterfront
            { lat: 43.62, lng: -79.48 },
            { lat: 43.60, lng: -79.54 },
            { lat: 43.56, lng: -79.60 },
            { lat: 43.52, lng: -79.64 },
            { lat: 43.48, lng: -79.68 },
            { lat: 43.45, lng: -79.71 },
            // West boundary - STOPS before Brampton
            { lat: 43.52, lng: -79.70 },
            { lat: 43.60, lng: -79.68 },
            { lat: 43.68, lng: -79.67 }, // Edge, avoiding Brampton
            // North through Vaughan
            { lat: 43.76, lng: -79.62 },
            { lat: 43.84, lng: -79.58 },
            { lat: 43.92, lng: -79.56 },
            { lat: 44.00, lng: -79.54 },
          ],
          strokeColor: '#16a34a',
          strokeOpacity: 1,
          strokeWeight: 3.5,
          fillColor: '#22c55e',
          fillOpacity: 0.12,
          map,
        });

        // Brampton - just a RED BORDER outline
        const bramptonOutline = new google.maps.Polygon({
          paths: [
            { lat: 43.80, lng: -79.92 },
            { lat: 43.80, lng: -79.70 },
            { lat: 43.64, lng: -79.70 },
            { lat: 43.64, lng: -79.92 },
          ],
          strokeColor: '#dc2626',
          strokeOpacity: 1,
          strokeWeight: 4,
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          map,
        });

        // Add label for Brampton
        new google.maps.Marker({
          position: { lat: 43.72, lng: -79.81 },
          map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 },
          label: {
            text: 'BRAMPTON',
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: 'bold',
          },
        });

        // Legend
        const legend = document.createElement('div');
        legend.innerHTML = `
          <div style="background: rgba(255,255,255,0.98); backdrop-filter: blur(12px); padding: 20px 24px; margin: 16px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); font-family: system-ui, sans-serif;">
            <div style="font-weight: 700; margin-bottom: 16px; color: #0f172a; font-size: 17px;">Service Coverage</div>
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
              <svg width="24" height="16" style="flex-shrink: 0;"><rect width="24" height="16" fill="rgba(34,197,94,0.15)" stroke="#16a34a" stroke-width="3" rx="4"/></svg>
              <span style="color: #16a34a; font-weight: 600; font-size: 15px;">We Serve This Area</span>
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
              <svg width="24" height="16" style="flex-shrink: 0;"><rect width="24" height="16" fill="rgba(239,68,68,0.15)" stroke="#dc2626" stroke-width="3" rx="4"/></svg>
              <span style="color: #dc2626; font-weight: 600; font-size: 15px;">Brampton (Excluded)</span>
            </div>
          </div>
        `;
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

        setIsLoaded(true);
      } catch (err) {
        console.error('Map error:', err);
        setError('Map failed to load');
      }
    };

    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => delete (window as any).initServiceMap;
  }, [isLoaded]);

  if (error) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-2xl">
        <p className="text-slate-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[500px]" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-slate-600 font-semibold">Loading service area map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
