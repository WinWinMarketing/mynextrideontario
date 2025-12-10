'use client';

import { useEffect, useRef, useState } from 'react';
import { config } from '@/lib/config';

// Professional service area polygon - follows land boundaries, excludes water
// Includes: Oshawa, Toronto, Markham, Vaughan, Newmarket, Aurora, Richmond Hill
// Excludes: Brampton (west side), Lake Ontario
const SERVICE_AREA_POLYGON = [
  // Start from Oshawa area (east) - clockwise
  { lat: 43.92, lng: -78.82 },  // North of Oshawa
  { lat: 43.87, lng: -78.85 },  // Oshawa
  { lat: 43.85, lng: -78.90 },  // West Oshawa
  
  // South along the lakeshore (staying on land)
  { lat: 43.82, lng: -78.95 },
  { lat: 43.78, lng: -79.05 },  // Ajax area
  { lat: 43.72, lng: -79.10 },  // Pickering
  { lat: 43.68, lng: -79.20 },  // Scarborough East
  { lat: 43.66, lng: -79.30 },  // Scarborough
  { lat: 43.64, lng: -79.38 },  // Toronto East
  { lat: 43.63, lng: -79.42 },  // Downtown Toronto (lakefront)
  { lat: 43.60, lng: -79.50 },  // Toronto West
  { lat: 43.58, lng: -79.55 },  // Etobicoke South
  { lat: 43.55, lng: -79.58 },  // Mississauga Lakeshore
  { lat: 43.52, lng: -79.62 },  // Port Credit area
  { lat: 43.48, lng: -79.65 },  // South Mississauga
  { lat: 43.45, lng: -79.68 },  // Oakville East
  
  // Cut west avoiding Brampton
  { lat: 43.50, lng: -79.70 },  // North Oakville
  { lat: 43.58, lng: -79.72 },  // Mississauga North
  { lat: 43.65, lng: -79.68 },  // Boundary before Brampton
  { lat: 43.72, lng: -79.65 },  // North boundary (avoiding Brampton)
  
  // Go north through Vaughan
  { lat: 43.78, lng: -79.60 },  // Woodbridge
  { lat: 43.82, lng: -79.55 },  // Vaughan
  { lat: 43.88, lng: -79.50 },  // King City area
  { lat: 43.95, lng: -79.45 },  // North of King
  
  // East through Newmarket/Aurora
  { lat: 44.02, lng: -79.40 },  // Newmarket North
  { lat: 44.05, lng: -79.30 },  // East Gwillimbury
  { lat: 44.02, lng: -79.20 },  // Georgina area
  { lat: 43.98, lng: -79.10 },  // Uxbridge area
  { lat: 43.95, lng: -79.00 },  // 
  { lat: 43.92, lng: -78.90 },  // Back towards Oshawa
  { lat: 43.92, lng: -78.82 },  // Close the polygon
];

// Key locations to mark
const LOCATIONS = {
  included: [
    { name: 'Oshawa', lat: 43.8971, lng: -78.8658 },
    { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
    { name: 'Markham', lat: 43.8561, lng: -79.3370 },
    { name: 'Vaughan', lat: 43.8361, lng: -79.4983 },
    { name: 'Newmarket', lat: 44.0592, lng: -79.4613 },
    { name: 'Aurora', lat: 44.0065, lng: -79.4504 },
    { name: 'Richmond Hill', lat: 43.8828, lng: -79.4403 },
    { name: 'Mississauga', lat: 43.5890, lng: -79.6441 },
    { name: 'Pickering', lat: 43.8384, lng: -79.0868 },
  ],
  excluded: [
    { name: 'Brampton', lat: 43.7315, lng: -79.7624 },
  ],
};

export function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || isLoaded) return;

    const apiKey = config.googleMaps.apiKey;
    
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Define the callback
    (window as any).initMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.75, lng: -79.35 },
          zoom: 9,
          mapTypeId: 'roadmap',
          styles: [
            // Clean, professional map style
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8d4e6' }] },
            { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          scrollwheel: false,
          gestureHandling: 'cooperative',
        });

        // Draw the service area polygon
        const serviceArea = new google.maps.Polygon({
          paths: SERVICE_AREA_POLYGON,
          strokeColor: '#1948b3',
          strokeOpacity: 0.9,
          strokeWeight: 3,
          fillColor: '#1948b3',
          fillOpacity: 0.15,
          geodesic: true,
        });
        serviceArea.setMap(map);

        // Add markers for included locations
        LOCATIONS.included.forEach((loc) => {
          const marker = new google.maps.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: loc.name,
          });

          // Info window
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px; font-family: system-ui, sans-serif;">
              <strong style="color: #22c55e;">✓ ${loc.name}</strong>
              <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Within service area</p>
            </div>`,
          });
          marker.addListener('click', () => infoWindow.open(map, marker));
        });

        // Add markers for excluded locations
        LOCATIONS.excluded.forEach((loc) => {
          const marker = new google.maps.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: loc.name,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px; font-family: system-ui, sans-serif;">
              <strong style="color: #ef4444;">✗ ${loc.name}</strong>
              <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Outside service area</p>
            </div>`,
          });
          marker.addListener('click', () => infoWindow.open(map, marker));
        });

        // Add legend
        const legendDiv = document.createElement('div');
        legendDiv.innerHTML = `
          <div style="background: white; padding: 12px 16px; margin: 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); font-family: system-ui, sans-serif; font-size: 13px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">Service Area</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="width: 12px; height: 12px; background: #22c55e; border-radius: 50%; display: inline-block;"></span>
              <span style="color: #475569;">Included</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%; display: inline-block;"></span>
              <span style="color: #475569;">Excluded</span>
            </div>
          </div>
        `;
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legendDiv);

        setIsLoaded(true);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
      }
    };

    script.onerror = () => {
      setError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      delete (window as any).initMap;
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [isLoaded]);

  if (error) {
    return (
      <div className="w-full h-[500px] rounded-xl bg-slate-100 flex items-center justify-center">
        <div className="text-center p-8">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-[500px] rounded-xl"
        style={{ minHeight: '500px' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
