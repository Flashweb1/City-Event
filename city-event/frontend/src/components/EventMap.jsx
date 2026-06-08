import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function EventMap({ events = [], height = '400px' }) {
  const [geoEvents, setGeoEvents] = useState([]);

  useEffect(() => {
    const geocoded = events.filter(e => e.location).slice(0, 50);
    setGeoEvents(geocoded.map(e => ({
      ...e,
      // Approximate lat/lng from location string — in production use geocoding API
      // For now, generate pseudo-coordinates from location hash
      lat: 40.7128 + (e.location.length % 10) * 0.5,
      lng: -74.0060 + (e.location.charCodeAt(0) % 10) * 0.5,
    })));
  }, [events]);

  if (geoEvents.length === 0) return null;

  return (
    <MapContainer
      center={[40.7128, -74.0060]}
      zoom={12}
      style={{ height, width: '100%', borderRadius: 'var(--radius-lg)', zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoEvents.map(event => (
        <Marker key={event.id} position={[event.lat, event.lng]}>
          <Popup>
            <div style={{ maxWidth: '200px' }}>
              <strong>{event.title}</strong><br />
              <small>{event.location}</small><br />
              <Link to={`/events/${event.id}`} style={{ color: '#00f5ff' }}>View Details →</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}