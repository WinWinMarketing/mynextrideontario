'use client';

import { useEffect, useRef, useState } from 'react';

// Service area - covers GTA but stays on land
const SERVICE_AREA_COORDS = [
  { lat: 44.10, lng: -79.60 },
  { lat: 44.10, lng: -79.00 },
  { lat: 43.95, lng: -78.80 },
  { lat: 43.85, lng: -78.85 },
  { lat: 43.80, lng: -78.95 },
  { lat: 43.70, lng: -79.10 },
  { lat: 43.65, lng: -79.25 },
  { lat: 43.63, lng: -79.40 },
  { lat: 43.62, lng: -79.50 },
  { lat: 43.58, lng: -79.58 },
  { lat: 43.52, lng: -79.65 },
  { lat: 43.45, lng: -79.70 },
  { lat: 43.55, lng: -79.75 },
  { lat: 43.65, lng: -79.72 },
  { lat: 43.75, lng: -79.68 },
  { lat: 43.85, lng: -79.65 },
  { lat: 43.95, lng: -79.62 },
  { lat: 44.05, lng: -79.60 },
];

// Brampton exclusion zone (RED)
const BRAMPTON_COORDS = [
  { lat: 43.82, lng: -79.95 },
  { lat: 43.82, lng: -79.68 },
  { lat: 43.65, lng: -79.68 },
  { lat: 43.65, lng: -79.95 },
];

// Cities with their status
const CITIES = [
  { name: 'Oshawa', lat: 43.8971, lng: -78.8658, included: true },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, included: true },
  { name: 'Markham', lat: 43.8561, lng: -79.3370, included: true },
  { name: 'Vaughan', lat: 43.8361, lng: -79.4983, included: true },
  { name: 'Richmond Hill', lat: 43.8828, lng: -79.4403, included: true },
  { name: 'Newmarket', lat: 44.0592, lng: -79.4613, included: true },
  { name: 'Mississauga', lat: 43.5890, lng: -79.6000, included: true },
  { name: 'Pickering', lat: 43.8384, lng: -79.0868, included: true },
  { name: 'Ajax', lat: 43.8509, lng: -79.0204, included: true },
  { name: 'Scarborough', lat: 43.7731, lng: -79.2578, included: true },
  { name: 'Brampton', lat: 43.7315, lng: -79.7624, included: false },
];

export function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || isLoaded) return;

    // Get API key from environment variable directly (client-side)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Prevent duplicate script loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initServiceAreaMap`;
    script.async = true;
    script.defer = true;

    (window as any).initServiceAreaMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.75, lng: -79.40 },
          zoom: 9,
          mapTypeId: 'roadmap',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b3d1e6' }] },
            { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f0f4f8' }] },
            { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
            { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
            { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
          scrollwheel: false,
          gestureHandling: 'cooperative',
        });

        // Service area polygon (green)
        new google.maps.Polygon({
          paths: SERVICE_AREA_COORDS,
          strokeColor: '#1948b3',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#22c55e',
          fillOpacity: 0.15,
          map,
        });

        // Brampton exclusion (red)
        new google.maps.Polygon({
          paths: BRAMPTON_COORDS,
          strokeColor: '#dc2626',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#ef4444',
          fillOpacity: 0.25,
          map,
        });

        // City markers
        CITIES.forEach((city) => {
          const marker = new google.maps.Marker({
            position: { lat: city.lat, lng: city.lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: city.included ? '#22c55e' : '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
            title: city.name,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 12px 16px; font-family: system-ui, -apple-system, sans-serif; min-width: 150px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span style="width: 12px; height: 12px; border-radius: 50%; background: ${city.included ? '#22c55e' : '#ef4444'};"></span>
                  <strong style="font-size: 16px; color: #1e293b;">${city.name}</strong>
                </div>
                <p style="margin: 0; font-size: 13px; color: ${city.included ? '#16a34a' : '#dc2626'};">
                  ${city.included ? '✓ Within Service Area' : '✗ Outside Service Area'}
                </p>
              </div>
            `,
          });

          marker.addListener('click', () => infoWindow.open(map, marker));
        });

        // Legend
        const legend = document.createElement('div');
        legend.innerHTML = `
          <div style="background: white; padding: 16px 20px; margin: 12px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.12); font-family: system-ui, -apple-system, sans-serif; font-size: 14px;">
            <div style="font-weight: 700; margin-bottom: 12px; color: #0f172a; font-size: 15px;">Service Area</div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="width: 14px; height: 14px; background: #22c55e; border-radius: 50%; flex-shrink: 0;"></span>
              <span style="color: #16a34a; font-weight: 500;">Included Areas</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 14px; height: 14px; background: #ef4444; border-radius: 50%; flex-shrink: 0;"></span>
              <span style="color: #dc2626; font-weight: 500;">Excluded (Brampton)</span>
            </div>
          </div>
        `;
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

        setIsLoaded(true);
      } catch (err) {
        console.error('Map error:', err);
        setError('Failed to initialize map');
      }
    };

    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      delete (window as any).initServiceAreaMap;
    };
  }, [isLoaded]);

  if (error) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center p-8">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-slate-500 font-medium">{error}</p>
          <p className="text-slate-400 text-sm mt-2">Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[500px]" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
