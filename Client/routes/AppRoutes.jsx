import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import Projects from "../pages/projects/Projects";
import Bugs from "../pages/bugs/Bugs";
import Members from "../pages/members/Members";
import ProjectDetails from "../pages/projects/ProjectDetails";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/bugs" element={<Bugs />} />
        <Route path="/members" element={<Members />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;