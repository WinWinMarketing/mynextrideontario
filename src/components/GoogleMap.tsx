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

    // Prevent duplicate script loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript && (window as any).google?.maps) {
      initMap();
      return;
    }

    if (existingScript) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGTAServiceMap`;
    script.async = true;
    script.defer = true;

    (window as any).initGTAServiceMap = initMap;

    function initMap() {
      if (!mapRef.current || isLoaded) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.72, lng: -79.30 },
          zoom: 9,
          styles: [
            { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#333333' }] },
            { featureType: 'landscape', stylers: [{ color: '#f0f0f0' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'road', stylers: [{ visibility: 'simplified' }, { saturation: -100 }, { lightness: 60 }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
            { featureType: 'road.arterial', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', stylers: [{ color: '#a8d4e6' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }, { weight: 0.5 }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 4 }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
          scrollwheel: false,
          gestureHandling: 'cooperative',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Load GeoJSON boundaries
        map.data.loadGeoJson('/gta-boundaries.geojson', undefined, (features) => {
          console.log('Loaded', features.length, 'boundary features');
        });

        // Style the features based on type
        map.data.setStyle((feature) => {
          const type = feature.getProperty('type');
          const isExcluded = type === 'excluded';
          
          return {
            fillColor: isExcluded ? '#ef4444' : '#22c55e',
            fillOpacity: isExcluded ? 0.25 : 0.20,
            strokeColor: isExcluded ? '#dc2626' : '#16a34a',
            strokeWeight: isExcluded ? 3 : 2,
            strokeOpacity: 0.9,
          };
        });

        // Add hover effects
        map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
          const type = event.feature.getProperty('type');
          const isExcluded = type === 'excluded';
          map.data.overrideStyle(event.feature, {
            fillOpacity: isExcluded ? 0.4 : 0.35,
            strokeWeight: isExcluded ? 4 : 3,
          });
        });

        map.data.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(event.feature);
        });

        // Add click to show city name
        const infoWindow = new google.maps.InfoWindow();
        map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
          const name = event.feature.getProperty('name');
          const type = event.feature.getProperty('type');
          const isExcluded = type === 'excluded';
          
          infoWindow.setContent(`
            <div style="padding: 8px 12px; font-family: system-ui, sans-serif;">
              <strong style="font-size: 14px; color: ${isExcluded ? '#dc2626' : '#166534'};">${name}</strong>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
                ${isExcluded ? 'Currently not serviced' : 'We serve this area'}
              </p>
            </div>
          `);
          infoWindow.setPosition(event.latLng);
          infoWindow.open(map);
        });

        // Add legend
        const legend = document.createElement('div');
        legend.innerHTML = `
          <div style="background: white; padding: 16px 20px; margin: 16px; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); font-family: system-ui, -apple-system, sans-serif;">
            <div style="font-weight: 700; margin-bottom: 14px; color: #0f172a; font-size: 14px; letter-spacing: -0.02em;">Service Area</div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
              <div style="width: 24px; height: 16px; background: rgba(34,197,94,0.25); border: 2.5px solid #16a34a; border-radius: 4px;"></div>
              <span style="color: #166534; font-weight: 600; font-size: 13px;">Cities We Serve</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 24px; height: 16px; background: rgba(239,68,68,0.25); border: 2.5px solid #dc2626; border-radius: 4px;"></div>
              <span style="color: #dc2626; font-weight: 600; font-size: 13px;">Brampton (Excluded)</span>
            </div>
          </div>
        `;
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

        setIsLoaded(true);
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to load map');
      }
    }

    script.onerror = () => setError('Map unavailable');
    document.head.appendChild(script);

    return () => {
      delete (window as any).initGTAServiceMap;
    };
  }, [isLoaded]);

  if (error) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-2xl">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-slate-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
      <div ref={mapRef} className="w-full h-[500px]" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-slate-600 font-semibold">Loading service area map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
