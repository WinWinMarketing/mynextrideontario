'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use the public environment variable for Google Maps
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Map configuration pending');
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      // Center on GTA (between Oshawa and Toronto)
      const center = { lat: 43.75, lng: -79.15 };
      
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 9,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ color: '#e8f0fe' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#a6bdf2' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#d2def9' }],
          },
          {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'road.local',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry.fill',
            stylers: [{ color: '#c8e6c9' }],
          },
          {
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#1948b3' }],
          },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'cooperative',
      });

      // Service area polygon (includes Oshawa, excludes Brampton)
      const serviceAreaCoords = [
        { lat: 44.05, lng: -78.75 },
        { lat: 44.05, lng: -79.25 },
        { lat: 43.95, lng: -79.45 },
        { lat: 43.70, lng: -79.45 },
        { lat: 43.55, lng: -79.20 },
        { lat: 43.55, lng: -78.75 },
        { lat: 43.75, lng: -78.65 },
      ];

      const serviceArea = new google.maps.Polygon({
        paths: serviceAreaCoords,
        strokeColor: '#1948b3',
        strokeOpacity: 0.9,
        strokeWeight: 3,
        fillColor: '#366be3',
        fillOpacity: 0.15,
      });

      serviceArea.setMap(map);

      // Oshawa marker (inside)
      new google.maps.Marker({
        position: { lat: 43.8971, lng: -78.8658 },
        map,
        title: 'Oshawa - Within Service Area',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      // Brampton marker (outside)
      new google.maps.Marker({
        position: { lat: 43.7315, lng: -79.7624 },
        map,
        title: 'Brampton - Outside Service Area',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      setIsLoaded(true);
    }).catch((err) => {
      console.error('Error loading Google Maps:', err);
      setError('Map temporarily unavailable');
    });
  }, []);

  if (error) {
    return (
      <div className="w-full h-[400px] rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-blue-100">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-blue-600 font-medium">Service Area Map</p>
          <p className="text-sm text-blue-400 mt-1">Eastern GTA Coverage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-xl border-2 border-blue-100">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-blue-600 font-medium">Loading map...</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
