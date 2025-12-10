'use client';

import { useEffect, useRef, useState } from 'react';

// Using Google Maps Data Layer to show actual city boundaries
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

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initRegionMap`;
    script.async = true;

    (window as any).initRegionMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.70, lng: -79.42 },
          zoom: 9.2,
          mapTypeId: 'roadmap',
          styles: [
            { featureType: 'all', elementType: 'geometry', stylers: [{ saturation: -10 }, { lightness: 15 }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#9ec3d9' }] },
            { featureType: 'landscape', stylers: [{ color: '#f8f9fa' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffffff' }, { weight: 1 }] },
            { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
            { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
          scrollwheel: false,
          gestureHandling: 'cooperative',
        });

        // Load GeoJSON for precise boundaries
        map.data.loadGeoJson('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/toronto.geojson', {}, (features) => {
          // Style the regions
          map.data.setStyle((feature) => {
            const name = feature.getProperty('name');
            const isExcluded = name && name.toLowerCase().includes('brampton');
            
            return {
              fillColor: isExcluded ? '#ef4444' : '#22c55e',
              fillOpacity: 0.18,
              strokeColor: isExcluded ? '#dc2626' : '#16a34a',
              strokeWeight: 2.5,
              strokeOpacity: 0.95,
            };
          });
        });

        // Fallback: Manual precise boundaries if GeoJSON fails
        setTimeout(() => {
          if (map.data.getFeatureById('0') === undefined) {
            // Draw service area with precise boundaries
            const servicePolygon = new google.maps.Polygon({
              paths: [
                { lat: 44.08, lng: -79.50 }, { lat: 44.05, lng: -79.20 },
                { lat: 43.95, lng: -78.82 }, { lat: 43.85, lng: -78.83 },
                { lat: 43.80, lng: -78.95 }, { lat: 43.72, lng: -79.10 },
                { lat: 43.66, lng: -79.30 }, { lat: 43.635, lng: -79.42 },
                { lat: 43.60, lng: -79.52 }, { lat: 43.55, lng: -79.62 },
                { lat: 43.48, lng: -79.69 }, { lat: 43.60, lng: -79.69 },
                { lat: 43.75, lng: -79.63 }, { lat: 43.90, lng: -79.57 },
                { lat: 44.02, lng: -79.52 },
              ],
              strokeColor: '#16a34a',
              strokeOpacity: 1,
              strokeWeight: 3,
              fillColor: '#22c55e',
              fillOpacity: 0.18,
              map,
            });

            // Brampton exclusion
            const bramptonPolygon = new google.maps.Polygon({
              paths: [
                { lat: 43.82, lng: -79.94 }, { lat: 43.82, lng: -79.69 },
                { lat: 43.62, lng: -79.69 }, { lat: 43.62, lng: -79.94 },
              ],
              strokeColor: '#dc2626',
              strokeOpacity: 1,
              strokeWeight: 3,
              fillColor: '#ef4444',
              fillOpacity: 0.25,
              map,
            });
          }
        }, 1000);

        // Legend
        const legend = document.createElement('div');
        legend.innerHTML = `
          <div style="background: rgba(255,255,255,0.98); backdrop-filter: blur(10px); padding: 18px 22px; margin: 14px; border-radius: 14px; box-shadow: 0 6px 24px rgba(0,0,0,0.15); font-family: system-ui, sans-serif;">
            <div style="font-weight: 700; margin-bottom: 14px; color: #0f172a; font-size: 16px; letter-spacing: -0.01em;">Service Coverage</div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
              <span style="width: 24px; height: 16px; background: rgba(34,197,94,0.2); border: 2.5px solid #16a34a; border-radius: 4px;"></span>
              <span style="color: #16a34a; font-weight: 600; font-size: 14px;">We Serve This Region</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="width: 24px; height: 16px; background: rgba(239,68,68,0.3); border: 2.5px solid #dc2626; border-radius: 4px;"></span>
              <span style="color: #dc2626; font-weight: 600; font-size: 14px;">Brampton (Excluded)</span>
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

    return () => delete (window as any).initRegionMap;
  }, [isLoaded]);

  if (error) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-xl">
        <p className="text-slate-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[500px]" />
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
