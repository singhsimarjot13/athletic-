import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import AdminLogin from "./admin";
import SportsApp from "./SportsApp";
import AdminDashboard from "./Admindashboard";
import CreateUser from "./createuser";
import ExportPage from "./export";
import RelaySportsApp from "./relayform";
import SportsAppfemale from "./femalesportsapp";
import Relayfemale from "./femalerelay";

function isAdminAuthenticated() {
  return localStorage.getItem("adminToken") !== null;  // Check if admin is logged in
}

function PrivateRoute({ element }) {
  return isAdminAuthenticated() ? element : <Navigate to="/admin-login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/sportsApp" element={<SportsApp />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/create-user" element={<PrivateRoute element={<CreateUser />} />} />
        <Route path="/export" element={<PrivateRoute element={<ExportPage />} />} />
        <Route path="/admin-dashboard" element={<PrivateRoute element={<AdminDashboard />} />} />
        <Route path="/relayapp" element={<RelaySportsApp />} />
        <Route path="/female-sportsapp" element={<SportsAppfemale />} />
        <Route path="/female-relayapp" element={<Relayfemale />} />
      </Routes>
    </Router>
  );
}

export default App;
