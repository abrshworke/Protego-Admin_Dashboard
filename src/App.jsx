
import { Routes, Route } from "react-router-dom";
import Overview from "./page/Overview";
import Incidents from "./page/Incidents";
import AnonymousReports from "./page/AnonymousReports";
import UserManagement from "./page/UserManagement";
import LiveMap from "./page/LiveMap";


export default function App() {
return (
<Routes> 
    
        <Route path="/" element={<Overview />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/reports" element={<AnonymousReports />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/map" element={<LiveMap />} /> 

</Routes>
);
}

