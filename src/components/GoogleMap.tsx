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
      setError('Map unavailable');
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGTAMap`;
    script.async = true;

    (window as any).initGTAMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.72, lng: -79.38 },
          zoom: 10,
          styles: [
            { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -30 }, { lightness: 10 }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'road.local', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'road.arterial', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dae8' }] },
            { featureType: 'landscape', stylers: [{ color: '#f5f5f5' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
          scrollwheel: false,
          gestureHandling: 'cooperative',
        });

        // Service Area - GTA (land only, clean boundary)
        const serviceArea = new google.maps.Polygon({
          paths: [
            // Northern boundary
            { lat: 44.00, lng: -79.60 },
            { lat: 44.00, lng: -79.00 },
            // Northeast - towards Oshawa
            { lat: 43.95, lng: -78.85 },
            { lat: 43.88, lng: -78.82 },
            { lat: 43.85, lng: -78.85 },
            // East coast - along Lake Ontario
            { lat: 43.82, lng: -78.88 },
            { lat: 43.77, lng: -79.02 },
            { lat: 43.70, lng: -79.15 },
            // Toronto waterfront
            { lat: 43.64, lng: -79.30 },
            { lat: 43.63, lng: -79.38 },
            { lat: 43.62, lng: -79.48 },
            // Southwest coast
            { lat: 43.55, lng: -79.58 },
            { lat: 43.52, lng: -79.63 },
            { lat: 43.48, lng: -79.68 },
            // West boundary - stops BEFORE Brampton
            { lat: 43.52, lng: -79.68 },
            { lat: 43.58, lng: -79.68 },
            { lat: 43.65, lng: -79.68 },
            // North through Vaughan, avoiding Brampton
            { lat: 43.72, lng: -79.68 },
            { lat: 43.80, lng: -79.65 },
            { lat: 43.88, lng: -79.62 },
            { lat: 43.95, lng: -79.60 },
          ],
          strokeColor: '#16a34a',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#22c55e',
          fillOpacity: 0.15,
          map,
        });

        // Brampton - RED border only
        const brampton = new google.maps.Polygon({
          paths: [
            { lat: 43.82, lng: -79.88 },
            { lat: 43.82, lng: -79.68 },
            { lat: 43.65, lng: -79.68 },
            { lat: 43.65, lng: -79.88 },
          ],
          strokeColor: '#dc2626',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          map,
        });

        // Brampton label
        new google.maps.Marker({
          position: { lat: 43.735, lng: -79.78 },
          map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 },
          label: {
            text: 'BRAMPTON',
            color: '#dc2626',
            fontSize: '11px',
            fontWeight: '700',
          },
        });

        // Legend
        const legend = document.createElement('div');
        legend.innerHTML = `
          <div style="background: white; padding: 16px 20px; margin: 12px; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); font-family: system-ui, sans-serif;">
            <div style="font-weight: 700; margin-bottom: 12px; color: #0f172a; font-size: 14px;">Service Coverage</div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="width: 20px; height: 14px; background: rgba(34,197,94,0.2); border: 2px solid #16a34a; border-radius: 3px;"></div>
              <span style="color: #16a34a; font-weight: 600; font-size: 13px;">We Serve This Area</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 20px; height: 14px; background: rgba(239,68,68,0.15); border: 2px solid #dc2626; border-radius: 3px;"></div>
              <span style="color: #dc2626; font-weight: 600; font-size: 13px;">Brampton (Excluded)</span>
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

    script.onerror = () => setError('Map unavailable');
    document.head.appendChild(script);

    return () => delete (window as any).initGTAMap;
  }, [isLoaded]);

  if (error) {
    return (
      <div className="w-full h-[450px] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-2xl">
        <p className="text-slate-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl">
      <div ref={mapRef} className="w-full h-[450px]" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-slate-600 font-medium">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
