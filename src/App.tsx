import { HashRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "./components/Toast";
import { MobileLayout } from "./layouts/MobileLayout";
import { DoiSoatPage } from "./pages/DoiSoatPage";
import { FmsPage } from "./pages/FmsPage";
import { HomePage } from "./pages/HomePage";
import { SettingsPage } from "./pages/SettingsPage";

export const App = () => {
  return (
    <HashRouter>
      <ToastContainer />
      <MobileLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/doi-soat" element={<DoiSoatPage />} />
          <Route path="/fms" element={<FmsPage />} />
          <Route path="/cai-dat" element={<SettingsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </MobileLayout>
    </HashRouter>
  );
};
