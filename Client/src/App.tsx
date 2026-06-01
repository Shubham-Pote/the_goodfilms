import "./index.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { DetailsPage } from "./pages/DetailsPage";
import { PlayerPage } from "./pages/PlayerPage";
import { SearchPage } from "./pages/Search";
import { Header } from "./components/Header";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function AppLayout() {
  const location = useLocation();
  // Hide header on player page (fullscreen experience)
  const isPlayerPage = location.pathname.startsWith("/play/");
  const isAuthPage = location.pathname === "/login";
  const isDetailPage = location.pathname.startsWith("/title/");

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {!isPlayerPage && !isAuthPage && !isDetailPage && <Header />}
      <Routes>
        <Route path="/title/:type/:id" element={<ProtectedRoute><DetailsPage /></ProtectedRoute>} />
        <Route path="/play/:type/:id" element={<ProtectedRoute><PlayerPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
