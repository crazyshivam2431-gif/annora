'use client';

import { useEffect, useRef, useState } from 'react';

type RescueItem = { id: string; name?: string; food_name?: string; status?: string; city?: string; location?: string; coordinates: [number, number]; };

export function LiveRescueMap() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [data, setData] = useState<{ donations: RescueItem[]; ngos: RescueItem[] }>({ donations: [], ngos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/rescue').then((response) => response.json()).then((result) => setData({ donations: result.donations ?? [], ngos: result.ngos ?? [] })).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const createMap = async () => {
      if (!mapElement.current || mapInstance.current) return;
      const leaflet = await import('leaflet');
      if (cancelled || !mapElement.current) return;
      const map = leaflet.map(mapElement.current, { zoomControl: true, scrollWheelZoom: false }).setView([26.9124, 75.7873], 11);
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
    };
    void createMap();
    return () => { cancelled = true; mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    void import('leaflet').then((leaflet) => {
      mapInstance.current.eachLayer((layer: any) => { if (layer instanceof leaflet.CircleMarker) mapInstance.current.removeLayer(layer); });
      data.donations.forEach((item) => leaflet.circleMarker(item.coordinates, { radius: 8, color: '#d76b35', fillColor: '#f08a45', fillOpacity: 0.9, weight: 2 }).addTo(mapInstance.current).bindPopup(`<strong>Donation</strong><br>${item.food_name ?? 'Food rescue'}<br>${item.status ?? 'POSTED'}`));
      data.ngos.forEach((item) => leaflet.circleMarker(item.coordinates, { radius: 8, color: '#185447', fillColor: '#2f8067', fillOpacity: 0.9, weight: 2 }).addTo(mapInstance.current).bindPopup(`<strong>${item.name ?? 'NGO / Shelter'}</strong><br>${item.city ?? 'Local network'}`));
    });
  }, [data]);

  return <div className="live-map-shell"><div ref={mapElement} className="live-map" aria-label="Live food rescue map" />{loading && <div className="map-loading">Loading live rescue network...</div>}<div className="map-legend"><span><i className="legend-dot donor" />Donations</span><span><i className="legend-dot ngo" />NGOs / Shelters</span></div></div>;
}
