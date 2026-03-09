import { useEffect, useState, useRef, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import SideBar from "../components/SideBar";
import Topbar from "../components/Topbar";
import L from "leaflet";
import Footer from "../components/Footer";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { AuthContext } from "../AuthProvider";
import subcityData from "../assets/subcities.json";

const getIcon = (status) => {
  const colors = { unresolved: "red", in_process: "orange", resolved: "green" };
  const color = colors[status] || "red";
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const STATUS_CYCLE = {
  unresolved: "in_process",
  in_process: "resolved",
  resolved: "unresolved",
};

const STATUS_STYLES = {
  unresolved: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    dot: "bg-red-500",
    btn: "bg-red-500 hover:bg-red-600",
    label: "Unresolved",
  },
  in_process: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
    dot: "bg-orange-500",
    btn: "bg-orange-500 hover:bg-orange-600",
    label: "In Process",
  },
  resolved: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    dot: "bg-green-500",
    btn: "bg-green-500 hover:bg-green-600",
    label: "Resolved",
  },
};

function FlyToLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 15, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

// Locks the map to a bounding box and sets initial view
function MapBoundController({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
      map.setMinZoom(13);
      map.setMaxBounds(bounds.pad(0.3));
    }
  }, [bounds, map]);
  return null;
}

function RoutingLayer({ userCoords, incidentCoords, onRouteInfo }) {
  const map = useMap();
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!userCoords || !incidentCoords) return;
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userCoords[1]},${userCoords[0]};${incidentCoords[1]},${incidentCoords[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
          const polyline = L.polyline(coords, {
            color: "#3b82f6",
            weight: 5,
            opacity: 0.8,
            dashArray: "10, 5",
          }).addTo(map);
          routeLayerRef.current = polyline;
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
          onRouteInfo({
            distKm: (route.distance / 1000).toFixed(1),
            durMin: Math.round(route.duration / 60),
          });
        }
      } catch (err) {
        console.error("Routing failed:", err);
      }
    };

    fetchRoute();
    return () => {
      if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
    };
  }, [userCoords, incidentCoords, map, onRouteInfo]);

  return null;
}

// Check if a coordinate is within a bounding box (with padding)
function isWithinBounds(lat, lng, bounds) {
  if (!bounds) return true;
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng;
}

export default function LiveMap() {
  const { role, region, woreda } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flyTo, setFlyTo] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [locatingId, setLocatingId] = useState(null);

  // Resolve center and bounds from region/woreda
  const mapConfig = (() => {
    // Admin sees all of Addis Ababa
    if (role === "admin") {
      const bounds = L.latLngBounds([8.85, 38.64], [9.12, 38.9]);
      return { center: [9.0154, 38.7686], bounds, zoom: 12 };
    }

    const subcity = subcityData.find(
      (s) => s.subcity.toLowerCase() === region?.toLowerCase(),
    );

    if (!subcity) {
      return { center: [9.0154, 38.7686], bounds: null, zoom: 13 };
    }

    // If woreda is specified, zoom to that woreda
    if (woreda) {
      const woredaData = subcity.woredas.find((w) => w.woreda === woreda);
      if (woredaData) {
        const lat = woredaData.lat;
        const lng = woredaData.lon;
        const delta = 0.008;
        const bounds = L.latLngBounds(
          [lat - delta, lng - delta],
          [lat + delta, lng + delta],
        );
        return { center: [lat, lng], bounds, zoom: 15 };
      }
    }

    // Subcity level bounds
    const woredaCoords = subcity.woredas.map((w) => [w.lat, w.lon]);
    const bounds = L.latLngBounds(woredaCoords).pad(0.02);
    return { center: [subcity.lat, subcity.lon], bounds, zoom: 14 };
  })();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "incidents"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setIncidents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter incidents to only show those within the authority's bounds
  const visibleIncidents = incidents.filter((incident) => {
    if (!incident.latitude || !incident.longitude) return false;
    if (role === "admin") return true;
    if (!mapConfig.bounds) return true;
    return isWithinBounds(
      incident.latitude,
      incident.longitude,
      mapConfig.bounds,
    );
  });

  const handleViewLocation = (incident) => {
    setFlyTo([incident.latitude, incident.longitude]);
    setActiveRoute(null);
    setRouteInfo(null);
  };

  const handleStatusChange = async (incident) => {
    const nextStatus = STATUS_CYCLE[incident.status] || "unresolved";
    setUpdatingId(incident.id);
    try {
      await updateDoc(doc(db, "incidents", incident.id), {
        status: nextStatus,
      });
    } catch (e) {
      console.error("Failed to update status:", e);
    }
    setUpdatingId(null);
  };

  const handleDirections = (incident) => {
    setLocatingId(incident.id);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(userCoords);
        setActiveRoute({
          userCoords,
          incidentCoords: [incident.latitude, incident.longitude],
        });
        setRouteInfo(null);
        setLocatingId(null);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Could not get your location. Please allow location access.");
        setLocatingId(null);
      },
    );
  };

  const clearRoute = () => {
    setActiveRoute(null);
    setRouteInfo(null);
    setUserLocation(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-800">
              Live Incidents In {region}: Woreda {woreda}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {role === "admin"
                ? "Viewing all incidents across Addis Ababa"
                : woreda
                  ? `Viewing: ${region} — Woreda ${woreda}`
                  : `Viewing: ${region} subcity`}
            </p>
          </div>

          <div className="flex gap-4 flex-1">
            {/* Map */}
            <div className="flex-1 rounded-xl shadow-lg overflow-hidden h-[80vh] relative">
              {routeInfo && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] bg-white shadow-lg rounded-full px-5 py-2 flex items-center gap-4 border border-blue-200">
                  <span className="text-sm font-semibold text-blue-700">
                    🚗 {routeInfo.distKm} km
                  </span>
                  <span className="w-px h-4 bg-slate-300" />
                  <span className="text-sm font-semibold text-slate-700">
                    ⏱ {routeInfo.durMin} min
                  </span>
                  <button
                    onClick={clearRoute}
                    className="text-xs text-slate-400 hover:text-red-500 font-bold ml-2 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-full bg-slate-200">
                  <p className="text-slate-500 text-lg">Loading map data...</p>
                </div>
              ) : (
                <MapContainer
                  center={mapConfig.center}
                  zoom={mapConfig.zoom}
                  scrollWheelZoom={true}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <MapBoundController
                    center={mapConfig.center}
                    bounds={mapConfig.bounds}
                  />
                  {flyTo && <FlyToLocation coords={flyTo} />}
                  {activeRoute && (
                    <RoutingLayer
                      userCoords={activeRoute.userCoords}
                      incidentCoords={activeRoute.incidentCoords}
                      onRouteInfo={setRouteInfo}
                    />
                  )}
                  {userLocation && (
                    <Marker position={userLocation} icon={blueIcon}>
                      <Popup>
                        <p className="text-sm font-semibold">
                          📍 Your Location
                        </p>
                      </Popup>
                    </Marker>
                  )}
                  {visibleIncidents.map((incident) => (
                    <Marker
                      key={incident.id}
                      position={[incident.latitude, incident.longitude]}
                      icon={getIcon(incident.status)}
                    >
                      <Popup>
                        <div className="text-sm space-y-1">
                          <p className="font-semibold">ID: {incident.id}</p>
                          <p>Status: {incident.status}</p>
                          <p>Lat: {incident.latitude?.toFixed(5)}</p>
                          <p>Lng: {incident.longitude?.toFixed(5)}</p>
                          {incident.createdAt && (
                            <p>
                              Reported:{" "}
                              {incident.createdAt.toDate().toLocaleString()}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="w-80 flex flex-col gap-3 h-[80vh]">
              <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">
                  Incidents
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-1 rounded-full">
                  {visibleIncidents.length} total
                </span>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-sm">Loading...</p>
                  </div>
                ) : visibleIncidents.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-sm text-center">
                      No incidents in your area
                    </p>
                  </div>
                ) : (
                  visibleIncidents.map((incident, index) => {
                    const style =
                      STATUS_STYLES[incident.status] ||
                      STATUS_STYLES["unresolved"];
                    const nextStatus = STATUS_CYCLE[incident.status];
                    const nextLabel =
                      STATUS_STYLES[nextStatus]?.label || "Unresolved";

                    return (
                      <div
                        key={incident.id}
                        className={`bg-white rounded-xl shadow-sm border ${style.border} p-4 flex flex-col gap-3`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            #{index + 1}
                          </span>
                          <span
                            className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${style.bg} ${style.text}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                            />
                            {style.label}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 space-y-0.5">
                          <p>
                            <span className="font-medium text-slate-700">
                              Lat:
                            </span>{" "}
                            {incident.latitude?.toFixed(6)}
                          </p>
                          <p>
                            <span className="font-medium text-slate-700">
                              Lng:
                            </span>{" "}
                            {incident.longitude?.toFixed(6)}
                          </p>
                          {incident.createdAt && (
                            <p>
                              <span className="font-medium text-slate-700">
                                Reported:
                              </span>{" "}
                              {incident.createdAt.toDate().toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewLocation(incident)}
                            className="flex-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded-lg transition-colors"
                          >
                            📍 View Location
                          </button>
                          <button
                            onClick={() => handleStatusChange(incident)}
                            disabled={updatingId === incident.id}
                            className={`flex-1 text-xs font-semibold text-white py-1.5 rounded-lg transition-colors ${style.btn} disabled:opacity-50`}
                          >
                            {updatingId === incident.id
                              ? "Saving..."
                              : `→ ${nextLabel}`}
                          </button>
                        </div>

                        <button
                          onClick={() => handleDirections(incident)}
                          disabled={locatingId === incident.id}
                          className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          {locatingId === incident.id ? (
                            <>
                              <svg
                                className="animate-spin w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8z"
                                />
                              </svg>
                              Getting Location...
                            </>
                          ) : (
                            <>🧭 Get Directions</>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
