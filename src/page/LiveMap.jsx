
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Sidebar from "../components/SideBar";
import Topbar from "../components/Topbar";
import { incidentsData } from "../assets/data"; // Reuse your existing incidents
import L from "leaflet";
import Footer from "../components/Footer";

// Optional: Custom marker icon
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function LiveMap() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <main className="flex-1 p-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Live Map
          </h1>
          <p className="text-slate-500 mb-6">
            Monitor real-time SOS alerts on the map.
          </p>

          <div className="h-[80vh] w-full rounded-xl shadow-lg overflow-hidden">
            <MapContainer
              center={[9.0154, 38.7686]} // Default center (Addis Ababa)
              zoom={12}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {incidentsData.map((incident) => {
                const coords = incident.location.split(",").map(Number);
                return (
                  <Marker
                    key={incident.id}
                    position={coords}
                    icon={redIcon}
                  >
                    <Popup>
                      <p className="font-semibold">{incident.id}</p>
                      <p>Source: {incident.source}</p>
                      <p>Priority: {incident.priority}</p>
                      <p>Status: {incident.status}</p>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </main>
        <Footer/>
      </div>
    </div>
  );
}



