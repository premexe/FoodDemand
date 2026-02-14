import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AuthenticatedSectionLayout from '../components/AuthenticatedSectionLayout';

const restaurantMarkerIcon = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ center, zoom = 13 }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
}

const COLLEGE_COORDS = [19.706457390666685, 72.78347640290356];
const COLLEGE_ADDRESS = 'Palghar-Manor Road, Palghar, Palghar Subdistrict, Palghar, Maharashtra, 401404, India';

const restaurantInfo = [
  { label: 'Restaurant Name', value: 'CookIQ Flagship Kitchen' },
  { label: 'Location', value: COLLEGE_ADDRESS },
  { label: 'Cuisine Type', value: 'North Indian + Multi Cuisine' },
  { label: 'Seating Capacity', value: '120' },
];

const modelSettings = [
  { label: 'Model Version', value: 'DemandNet v4.2' },
  { label: 'Forecast Horizon', value: '1-7 days' },
  { label: 'Retrain Frequency', value: 'Weekly (Auto)' },
  { label: 'Confidence Threshold', value: '0.72' },
];

export default function ProfilePage() {
  const defaultCollegeCenter = COLLEGE_COORDS;
  const restaurantLocation = useMemo(
    () => restaurantInfo.find((item) => item.label === 'Location')?.value || 'Bengaluru, India',
    [],
  );
  const [mapCenter, setMapCenter] = useState(defaultCollegeCenter);
  const serviceRadiusMeters = 5000;

  useEffect(() => {
    let cancelled = false;

    async function geocodeLocation() {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(restaurantLocation)}`,
          { headers: { Accept: 'application/json' } },
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return;
        const first = data[0];
        const lat = Number(first.lat);
        const lng = Number(first.lon);
        if (!cancelled && Number.isFinite(lat) && Number.isFinite(lng)) {
          setMapCenter([lat, lng]);
        }
      } catch {
        // Keep default center when geocoding is unavailable.
      }
    }

    geocodeLocation();

    return () => {
      cancelled = true;
    };
  }, [restaurantLocation]);

  return (
    <AuthenticatedSectionLayout
      title="Profile"
      subtitle="User, restaurant, theme, and model configuration in one control workspace."
    >
      {({ activeTheme, cardStyle, user, resolvedTheme, onLogout }) => {
        const verificationLabel = user?.verificationMethod
          ? user.verificationMethod.charAt(0).toUpperCase() + user.verificationMethod.slice(1)
          : 'Unknown';
        const userName = user?.name || 'Restaurant Operator';
        const initials = userName
          .split(' ')
          .map((part) => part[0] || '')
          .join('')
          .slice(0, 2)
          .toUpperCase();

        const userInfo = [
          { label: 'Full Name', value: user?.name || 'Not available' },
          { label: 'Email', value: user?.email || 'Not available' },
          { label: 'Phone', value: user?.phoneNumber || 'Not available' },
          { label: 'Verification', value: verificationLabel },
          { label: 'Theme', value: resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1) },
        ];

        const quickStats = [
          { label: 'Restaurant Units', value: '1' },
          { label: 'Model Version', value: 'v4.2' },
          { label: 'Forecast Window', value: '7 Days' },
          { label: 'Profile Status', value: 'Active' },
        ];

        return (
          <div className="space-y-6">
            <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="bento-card p-6 xl:col-span-2" style={cardStyle}>
                <div
                  className="rounded-3xl p-5 border"
                  style={{
                    borderColor: activeTheme.border,
                    background: resolvedTheme === 'dark'
                      ? 'linear-gradient(135deg, rgba(0,255,157,0.16), rgba(0,0,0,0.08) 55%, rgba(141,231,203,0.15))'
                      : 'linear-gradient(135deg, rgba(0,180,110,0.14), rgba(255,255,255,0.6) 55%, rgba(0,180,110,0.1))',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="badge-neon mb-3 w-fit">Profile Overview</div>
                      <h2 className="text-2xl font-black uppercase tracking-tight">{userName}</h2>
                      <p className="text-sm font-semibold mt-2 break-all" style={{ color: activeTheme.muted }}>
                        {user?.email || 'No email available'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.16em]" style={{ ...cardStyle, borderColor: activeTheme.border }}>
                          {verificationLabel} verified
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.16em]" style={{ ...cardStyle, borderColor: activeTheme.border }}>
                          Theme: {resolvedTheme}
                        </span>
                      </div>
                    </div>
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black"
                      style={{
                        color: resolvedTheme === 'dark' ? '#03110b' : '#ffffff',
                        backgroundColor: resolvedTheme === 'dark' ? '#00ff9d' : '#00b46e',
                      }}
                    >
                      {initials}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bento-card p-6 xl:col-span-3" style={cardStyle}>
                <div className="badge-neon mb-4 w-fit">Control Snapshot</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {quickStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl p-4 border"
                      style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.soft }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: activeTheme.muted }}>{stat.label}</p>
                      <p className="text-xl font-black mt-2">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bento-card p-6" style={cardStyle}>
                  <div className="badge-neon mb-4 w-fit">Model Settings</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {modelSettings.map((setting) => (
                      <div key={setting.label} className="rounded-2xl p-4 border" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.soft }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: activeTheme.muted }}>{setting.label}</p>
                        <p className="text-base font-black mt-2">{setting.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bento-card p-6" style={cardStyle}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="badge-neon w-fit">Service Radius Map</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: activeTheme.muted }}>
                      Radius {serviceRadiusMeters / 1000} km
                    </span>
                  </div>
                  <p className="text-xs font-semibold mb-3" style={{ color: activeTheme.muted }}>
                    Centered at {restaurantLocation}
                  </p>
                  <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: activeTheme.border }}>
                    <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="w-full h-[300px] md:h-[340px]">
                      <RecenterMap center={mapCenter} zoom={13} />
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Circle
                        center={mapCenter}
                        radius={serviceRadiusMeters}
                        pathOptions={{
                          color: resolvedTheme === 'dark' ? '#00ff9d' : '#00b46e',
                          fillColor: resolvedTheme === 'dark' ? '#00ff9d' : '#00b46e',
                          fillOpacity: 0.18,
                          weight: 2,
                        }}
                      />
                      <Marker position={mapCenter} icon={restaurantMarkerIcon}>
                        <Popup>
                          <strong>CookIQ Flagship Kitchen</strong>
                          <br />
                          {restaurantLocation}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                  <p className="text-[11px] font-semibold mt-3" style={{ color: activeTheme.muted }}>
                    Marker is the restaurant center and the circle shows delivery/service coverage.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bento-card p-6" style={cardStyle}>
                  <div className="badge-neon mb-4 w-fit">Restaurant Info</div>
                  <div className="space-y-3">
                    {restaurantInfo.map((item) => (
                      <div key={item.label} className="rounded-2xl p-4 border" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.soft }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: activeTheme.muted }}>{item.label}</p>
                        <p className="text-base font-black mt-2">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bento-card p-6" style={cardStyle}>
                  <div className="badge-neon mb-4 w-fit">User Access</div>
                  <div className="space-y-3 mb-5">
                    {userInfo.map((item) => (
                      <div key={item.label} className="rounded-2xl p-4 border" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.soft }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: activeTheme.muted }}>{item.label}</p>
                        <p className="text-sm font-semibold mt-2 break-all">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl p-4 mb-4" style={{ ...cardStyle, backgroundColor: resolvedTheme === 'dark' ? 'rgba(0,223,140,0.08)' : 'rgba(0,180,110,0.08)' }}>
                    <p className="text-xs font-semibold" style={{ color: activeTheme.muted }}>
                      Theme toggle is in the top bar. Logout when switching operators.
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full py-3 rounded-2xl text-sm font-black uppercase tracking-[0.16em]"
                    style={{
                      color: resolvedTheme === 'dark' ? '#03110b' : '#ffffff',
                      backgroundColor: resolvedTheme === 'dark' ? '#00ff9d' : '#00b46e',
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </section>
          </div>
        );
      }}
    </AuthenticatedSectionLayout>
  );
}
