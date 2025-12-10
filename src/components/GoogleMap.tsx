'use client';

import { useEffect, useRef, useState } from 'react';

// Precise city boundary polygons for GTA
const CITY_BOUNDARIES = {
  toronto: [
    { lat: 43.855, lng: -79.639 }, { lat: 43.855, lng: -79.116 },
    { lat: 43.581, lng: -79.116 }, { lat: 43.581, lng: -79.639 },
  ],
  markham: [
    { lat: 43.955, lng: -79.395 }, { lat: 43.955, lng: -79.186 },
    { lat: 43.815, lng: -79.186 }, { lat: 43.815, lng: -79.395 },
  ],
  vaughan: [
    { lat: 43.920, lng: -79.666 }, { lat: 43.920, lng: -79.395 },
    { lat: 43.770, lng: -79.395 }, { lat: 43.770, lng: -79.666 },
  ],
  richmondHill: [
    { lat: 43.920, lng: -79.480 }, { lat: 43.920, lng: -79.350 },
    { lat: 43.840, lng: -79.350 }, { lat: 43.840, lng: -79.480 },
  ],
  mississauga: [
    { lat: 43.735, lng: -79.750 }, { lat: 43.735, lng: -79.505 },
    { lat: 43.505, lng: -79.505 }, { lat: 43.505, lng: -79.750 },
  ],
  oakville: [
    { lat: 43.520, lng: -79.780 }, { lat: 43.520, lng: -79.575 },
    { lat: 43.375, lng: -79.575 }, { lat: 43.375, lng: -79.780 },
  ],
  pickering: [
    { lat: 43.920, lng: -79.116 }, { lat: 43.920, lng: -78.955 },
    { lat: 43.775, lng: -78.955 }, { lat: 43.775, lng: -79.116 },
  ],
  ajax: [
    { lat: 43.885, lng: -79.060 }, { lat: 43.885, lng: -78.920 },
    { lat: 43.800, lng: -78.920 }, { lat: 43.800, lng: -79.060 },
  ],
  whitby: [
    { lat: 43.920, lng: -78.955 }, { lat: 43.920, lng: -78.820 },
    { lat: 43.820, lng: -78.820 }, { lat: 43.820, lng: -78.955 },
  ],
  oshawa: [
    { lat: 43.950, lng: -78.920 }, { lat: 43.950, lng: -78.750 },
    { lat: 43.830, lng: -78.750 }, { lat: 43.830, lng: -78.920 },
  ],
  newmarket: [
    { lat: 44.080, lng: -79.510 }, { lat: 44.080, lng: -79.380 },
    { lat: 43.990, lng: -79.380 }, { lat: 43.990, lng: -79.510 },
  ],
  aurora: [
    { lat: 44.015, lng: -79.510 }, { lat: 44.015, lng: -79.380 },
    { lat: 43.950, lng: -79.380 }, { lat: 43.950, lng: -79.510 },
  ],
  // Brampton - RED
  brampton: [
    { lat: 43.820, lng: -79.920 }, { lat: 43.820, lng: -79.666 },
    { lat: 43.630, lng: -79.666 }, { lat: 43.630, lng: -79.920 },
  ],
};

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initCityMap`;
    script.async = true;

    (window as any).initCityMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.72, lng: -79.38 },
          zoom: 9.5,
          styles: [
            { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'on' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'road', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dae8' }] },
            { featureType: 'landscape', stylers: [{ color: '#f0f0f0' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }, { weight: 0.8 }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
          scrollwheel: false,
          gestureHandling: 'cooperative',
        });

        // Draw each city as interlocking polygons
        Object.entries(CITY_BOUNDARIES).forEach(([city, coords]) => {
          const isBrampton = city === 'brampton';
          
          new google.maps.Polygon({
            paths: coords,
            strokeColor: isBrampton ? '#dc2626' : '#16a34a',
            strokeOpacity: 1,
            strokeWeight: isBrampton ? 3 : 2,
            fillColor: isBrampton ? '#ef4444' : '#22c55e',
            fillOpacity: isBrampton ? 0.25 : 0.20,
            map,
          });

          // City label
          const center = {
            lat: coords.reduce((sum, c) => sum + c.lat, 0) / coords.length,
            lng: coords.reduce((sum, c) => sum + c.lng, 0) / coords.length,
          };

          new google.maps.Marker({
            position: center,
            map,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 },
            label: {
              text: city.charAt(0).toUpperCase() + city.slice(1).replace(/([A-Z])/g, ' $1'),
              color: isBrampton ? '#dc2626' : '#166534',
              fontSize: '11px',
              fontWeight: '600',
            },
          });
        });

        // Legend
        const legend = document.createElement('div');
        legend.innerHTML = `
          <div style="background: white; padding: 14px 18px; margin: 12px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); font-family: system-ui;">
            <div style="font-weight: 700; margin-bottom: 10px; color: #0f172a; font-size: 13px;">Service Area</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <div style="width: 16px; height: 12px; background: rgba(34,197,94,0.25); border: 2px solid #16a34a; border-radius: 2px;"></div>
              <span style="color: #16a34a; font-weight: 600; font-size: 12px;">Cities We Serve</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 12px; background: rgba(239,68,68,0.25); border: 2px solid #dc2626; border-radius: 2px;"></div>
              <span style="color: #dc2626; font-weight: 600; font-size: 12px;">Brampton (Excluded)</span>
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

    return () => delete (window as any).initCityMap;
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
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-slate-600 font-medium text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
