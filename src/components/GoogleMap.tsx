'use client';

import { useEffect, useRef, useState } from 'react';

// Cities to highlight as INCLUDED (green)
const INCLUDED_CITIES = [
  'Oshawa, ON',
  'Toronto, ON',
  'Markham, ON',
  'Vaughan, ON',
  'Richmond Hill, ON',
  'Newmarket, ON',
  'Aurora, ON',
  'Mississauga, ON',
  'Pickering, ON',
  'Ajax, ON',
  'Whitby, ON',
  'Oakville, ON',
];

// Cities to highlight as EXCLUDED (red)
const EXCLUDED_CITIES = [
  'Brampton, ON',
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

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initPreciseMap`;
    script.async = true;
    script.defer = true;

    (window as any).initPreciseMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 43.75, lng: -79.40 },
          zoom: 9.5,
          mapTypeId: 'roadmap',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8c8dc' }] },
            { featureType: 'landscape', stylers: [{ color: '#f5f7fa' }] },
            { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
            { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
            { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#1e293b' }] },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
          scrollwheel: false,
          gestureHandling: 'cooperative',
        });

        const geocoder = new google.maps.Geocoder();
        const placesService = new google.maps.places.PlacesService(map);

        // Function to get and highlight city boundaries
        const highlightCity = async (cityName: string, isIncluded: boolean) => {
          try {
            // Geocode to get place_id
            const geocodeResult = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
              geocoder.geocode({ address: cityName }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocode failed for ${cityName}`));
                }
              });
            });

            const placeId = geocodeResult.place_id;

            // Get place details including geometry
            placesService.getDetails({ placeId, fields: ['geometry', 'name'] }, (place, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
                // Create a marker for the city
                const marker = new google.maps.Marker({
                  position: place.geometry.location!,
                  map,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: isIncluded ? '#22c55e' : '#ef4444',
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                  },
                  title: cityName,
                  label: {
                    text: cityName.split(',')[0].toUpperCase(),
                    color: isIncluded ? '#16a34a' : '#dc2626',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  },
                });

                // Add info window
                const infoWindow = new google.maps.InfoWindow({
                  content: `
                    <div style="padding: 14px 18px; font-family: system-ui, sans-serif; min-width: 160px;">
                      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="width: 14px; height: 14px; border-radius: 50%; background: ${isIncluded ? '#22c55e' : '#ef4444'};"></span>
                        <strong style="font-size: 17px; color: #0f172a;">${cityName.split(',')[0]}</strong>
                      </div>
                      <p style="margin: 0; font-size: 14px; font-weight: 500; color: ${isIncluded ? '#16a34a' : '#dc2626'};">
                        ${isIncluded ? '✓ We Serve This Area' : '✗ Not in Service Area'}
                      </p>
                    </div>
                  `,
                });

                marker.addListener('click', () => infoWindow.open(map, marker));

                // Draw a circle around the city to show coverage
                if (place.geometry.viewport) {
                  const circle = new google.maps.Circle({
                    map,
                    center: place.geometry.location!,
                    radius: isIncluded ? 8000 : 6000, // 8km for included, 6km for excluded
                    fillColor: isIncluded ? '#22c55e' : '#ef4444',
                    fillOpacity: 0.15,
                    strokeColor: isIncluded ? '#16a34a' : '#dc2626',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                  });
                }
              }
            });
          } catch (err) {
            console.error(`Failed to highlight ${cityName}:`, err);
          }
        };

        // Highlight all included cities
        INCLUDED_CITIES.forEach(city => highlightCity(city, true));
        
        // Highlight excluded cities
        EXCLUDED_CITIES.forEach(city => highlightCity(city, false));

        // Add legend
        const legend = document.createElement('div');
        legend.innerHTML = `
          <div style="background: white; padding: 16px 20px; margin: 12px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-family: system-ui, sans-serif;">
            <div style="font-weight: 700; margin-bottom: 12px; color: #0f172a; font-size: 15px;">Service Coverage</div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="width: 16px; height: 16px; background: rgba(34,197,94,0.3); border: 2px solid #16a34a; border-radius: 50%;"></span>
              <span style="color: #16a34a; font-weight: 600;">We Serve</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 16px; height: 16px; background: rgba(239,68,68,0.35); border: 2px solid #dc2626; border-radius: 50%;"></span>
              <span style="color: #dc2626; font-weight: 600;">Not Served</span>
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
      delete (window as any).initPreciseMap;
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
      <div ref={mapRef} className="w-full h-[500px]" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Loading service area map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
