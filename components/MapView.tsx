import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface MapViewProps {
  chefLocation?: { latitude: number; longitude: number; name?: string };
  customerLocation?: { latitude: number; longitude: number };
  deliveryLocation?: { latitude: number; longitude: number };
  showRoute?: boolean;
  radiusKm?: number;
  height?: number;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    subtitle?: string;
    type: 'chef' | 'customer' | 'delivery';
  }>;
  onMarkerPress?: (id: string) => void;
}

/**
 * Web MapView — Real interactive map using Leaflet + OpenStreetMap.
 * No API key required. Loads Leaflet via CDN inside an iframe.
 */
export function MapView({
  chefLocation,
  customerLocation,
  deliveryLocation,
  showRoute = false,
  radiusKm,
  height = 220,
  markers = [],
}: MapViewProps) {
  const { colors } = useTheme();

  const center = chefLocation
    ? [chefLocation.latitude, chefLocation.longitude]
    : [36.7538, 3.0588]; // Default: Algiers

  const html = useMemo(() => {
    const markerData: Array<{ lat: number; lng: number; label: string; emoji: string; color: string }> = [];

    if (chefLocation) {
      markerData.push({
        lat: chefLocation.latitude,
        lng: chefLocation.longitude,
        label: chefLocation.name || 'Chef',
        emoji: '👨‍🍳',
        color: '#8d4b00',
      });
    }
    if (customerLocation) {
      markerData.push({
        lat: customerLocation.latitude,
        lng: customerLocation.longitude,
        label: 'You',
        emoji: '📍',
        color: '#0369a1',
      });
    }
    if (deliveryLocation) {
      markerData.push({
        lat: deliveryLocation.latitude,
        lng: deliveryLocation.longitude,
        label: 'Delivery',
        emoji: '🛵',
        color: '#15803d',
      });
    }
    markers.forEach((m) => {
      markerData.push({
        lat: m.latitude,
        lng: m.longitude,
        label: m.title,
        emoji: m.type === 'chef' ? '👨‍🍳' : m.type === 'delivery' ? '🛵' : '📍',
        color: m.type === 'chef' ? '#8d4b00' : m.type === 'delivery' ? '#15803d' : '#0369a1',
      });
    });

    // Route polyline data
    const routeCoords = showRoute && chefLocation && (deliveryLocation || customerLocation)
      ? JSON.stringify([
          [chefLocation.latitude, chefLocation.longitude],
          [(deliveryLocation || customerLocation)!.latitude, (deliveryLocation || customerLocation)!.longitude],
        ])
      : 'null';

    // Radius circle data
    const radiusData = radiusKm && chefLocation
      ? JSON.stringify({ lat: chefLocation.latitude, lng: chefLocation.longitude, radius: radiusKm * 1000 })
      : 'null';

    return `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%}
    .leaflet-control-attribution{font-size:9px!important;opacity:0.6}
  </style>
</head><body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      scrollWheelZoom: true
    }).setView([${center[0]}, ${center[1]}], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    var markers = ${JSON.stringify(markerData)};
    var bounds = [];

    markers.forEach(function(m) {
      var icon = L.divIcon({
        html: '<div style="font-size:22px;text-shadow:0 2px 4px rgba(0,0,0,0.3);text-align:center;line-height:32px">' + m.emoji + '</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
        className: ''
      });
      L.marker([m.lat, m.lng], { icon: icon })
        .bindPopup('<div style="font-family:sans-serif;font-size:13px;font-weight:600;padding:2px">' + m.label + '</div>')
        .addTo(map);
      bounds.push([m.lat, m.lng]);
    });

    var route = ${routeCoords};
    if (route) {
      L.polyline(route, {
        color: '#8d4b00',
        weight: 3,
        dashArray: '8,5',
        opacity: 0.7
      }).addTo(map);
    }

    var circle = ${radiusData};
    if (circle) {
      L.circle([circle.lat, circle.lng], {
        radius: circle.radius,
        color: 'rgba(141,75,0,0.3)',
        fillColor: 'rgba(141,75,0,0.08)',
        fillOpacity: 0.5,
        weight: 1.5
      }).addTo(map);
    }

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }
  <\/script>
</body></html>`;
  }, [chefLocation, customerLocation, deliveryLocation, showRoute, radiusKm, markers]);

  // Web: render via iframe (native browser element, no extra packages)
  return (
    <View style={[styles.container, { height, borderRadius: 16, overflow: 'hidden' }]}>
      {/* @ts-ignore — iframe is valid on web */}
      <iframe
        srcDoc={html}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 16,
        }}
        title="HomeChef Map"
        sandbox="allow-scripts"
      />
    </View>
  );
}

/** Mini map for inline use (e.g. chef profile cards) */
export function MiniMapView({ latitude, longitude, size = 80 }: {
  latitude: number;
  longitude: number;
  size?: number;
}) {
  const html = useMemo(() => `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>*{margin:0;padding:0}#map{width:100%;height:100%}</style>
</head><body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false
    }).setView([${latitude}, ${longitude}], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);
    var icon = L.divIcon({
      html: '<div style="font-size:20px;text-align:center;line-height:28px">📍</div>',
      iconSize: [28, 28], iconAnchor: [14, 28], className: ''
    });
    L.marker([${latitude}, ${longitude}], { icon: icon }).addTo(map);
  <\/script>
</body></html>`, [latitude, longitude]);

  return (
    <View style={[styles.miniMap, { width: size, height: size }]}>
      {/* @ts-ignore */}
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: 10 }}
        title="Mini Map"
        sandbox="allow-scripts"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  miniMap: { borderRadius: 10, overflow: 'hidden' },
});
