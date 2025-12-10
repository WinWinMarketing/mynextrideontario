'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Map API key not configured');
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
      const center = { lat: 43.7, lng: -79.2 };
      
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 9,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#d2def9' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#799cec' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#1948b3' }],
          },
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#1948b3' }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Create a service area polygon that includes Oshawa but excludes Brampton
      // This is an approximate polygon for the eastern GTA
      const serviceAreaCoords = [
        { lat: 44.0, lng: -78.8 },  // North of Oshawa
        { lat: 44.0, lng: -79.2 },  // North
        { lat: 43.9, lng: -79.4 },  // West limit (before Brampton)
        { lat: 43.6, lng: -79.4 },  // South-west
        { lat: 43.5, lng: -79.0 },  // South
        { lat: 43.5, lng: -78.7 },  // South-east
        { lat: 43.8, lng: -78.7 },  // East
      ];

      const serviceArea = new google.maps.Polygon({
        paths: serviceAreaCoords,
        strokeColor: '#1948b3',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: '#366be3',
        fillOpacity: 0.25,
      });

      serviceArea.setMap(map);

      // Add markers for reference
      const oshawaMarker = new google.maps.Marker({
        position: { lat: 43.8971, lng: -78.8658 },
        map,
        title: 'Oshawa - Within Service Area',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const bramptonMarker = new google.maps.Marker({
        position: { lat: 43.7315, lng: -79.7624 },
        map,
        title: 'Brampton - Outside Service Area',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Info windows
      const oshawaInfo = new google.maps.InfoWindow({
        content: '<div style="padding: 8px; font-weight: bold; color: #22c55e;">✓ Oshawa - Service Area</div>',
      });
      
      const bramptonInfo = new google.maps.InfoWindow({
        content: '<div style="padding: 8px; font-weight: bold; color: #ef4444;">✗ Brampton - Outside Area</div>',
      });

      oshawaMarker.addListener('click', () => {
        oshawaInfo.open(map, oshawaMarker);
      });

      bramptonMarker.addListener('click', () => {
        bramptonInfo.open(map, bramptonMarker);
      });

      setIsLoaded(true);
    }).catch((err) => {
      console.error('Error loading Google Maps:', err);
      setError('Failed to load map');
    });
  }, []);

  if (error) {
    return (
      <div className="w-full h-[400px] rounded-2xl bg-primary-100 flex items-center justify-center">
        <p className="text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-xl">
      {!isLoaded && (
        <div className="absolute inset-0 bg-primary-100 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-muted">Loading map...</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

