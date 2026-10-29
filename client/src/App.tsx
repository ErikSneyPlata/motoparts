import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { Shell } from "./components/Shell";
import { Loading } from "./components/ui";
import { useSessionStore } from "./store/session";
import type { UserRole } from "./types";

const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const WorkshopPage = lazy(() => import("./pages/WorkshopPage").then((m) => ({ default: m.WorkshopPage })));
const CatalogPage = lazy(() => import("./pages/OperationalPages").then((m) => ({ default: m.CatalogPage })));
const RequestsPage = lazy(() => import("./pages/OperationalPages").then((m) => ({ default: m.RequestsPage })));
const ScannerPage = lazy(() => import("./pages/OperationalPages").then((m) => ({ default: m.ScannerPage })));
const InventoryPage = lazy(() => import("./pages/InventorySalesPages").then((m) => ({ default: m.InventoryPage })));
const SalesPage = lazy(() => import("./pages/InventorySalesPages").then((m) => ({ default: m.SalesPage })));
const DashboardPage = lazy(() => import("./pages/InsightsPages").then((m) => ({ default: m.DashboardPage })));
const MotorcyclePage = lazy(() => import("./pages/InsightsPages").then((m) => ({ default: m.MotorcyclePage })));
const ReportsPage = lazy(() => import("./pages/InsightsPages").then((m) => ({ default: m.ReportsPage })));
const AuditPage = lazy(() => import("./pages/AdminPages").then((m) => ({ default: m.AuditPage })));
const UsersPage = lazy(() => import("./pages/AdminPages").then((m) => ({ default: m.UsersPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((m) => ({ default: m.SearchPage })));

function landing(role:UserRole){return role==="MANAGER"?"/dashboard":role==="SALES"?"/sales":role==="WAREHOUSE"?"/requests":"/workshop";}
function Guard({roles}:{roles?:UserRole[]}){const user=useSessionStore(s=>s.user);const token=useSessionStore(s=>s.token);if(!user||!token)return <Navigate to="/login" replace/>;if(roles&&!roles.includes(user.role))return <Navigate to={landing(user.role)} replace/>;return <Outlet/>;}
function Home(){const user=useSessionStore(s=>s.user);return <Navigate to={landing(user!.role)} replace/>;}
function Permit({roles,children}:{roles:UserRole[];children:ReactNode}){const user=useSessionStore(s=>s.user);return user&&roles.includes(user.role)?<>{children}</>:<Navigate to={landing(user!.role)} replace/>;}
function App(){return <Suspense fallback={<Loading/>}><Routes><Route path="/login" element={<LoginPage/>}/><Route element={<Guard/>}><Route element={<Shell><Outlet/></Shell>}><Route path="/" element={<Home/>}/><Route path="/search" element={<SearchPage/>}/><Route path="/workshop" element={<Permit roles={["MECHANIC","ADMIN"]}><WorkshopPage/></Permit>}/><Route path="/dashboard" element={<Permit roles={["MANAGER","ADMIN"]}><DashboardPage/></Permit>}/><Route path="/reports" element={<Permit roles={["MANAGER","ADMIN"]}><ReportsPage/></Permit>}/><Route path="/motorcycles" element={<Permit roles={["MECHANIC","WAREHOUSE","SALES","MANAGER","ADMIN"]}><MotorcyclePage/></Permit>}/><Route path="/parts" element={<CatalogPage/>}/><Route path="/requests" element={<Permit roles={["MECHANIC","WAREHOUSE","MANAGER","ADMIN"]}><RequestsPage/></Permit>}/><Route path="/inventory" element={<Permit roles={["WAREHOUSE","MANAGER","ADMIN"]}><InventoryPage/></Permit>}/><Route path="/sales" element={<Permit roles={["SALES","MANAGER","ADMIN"]}><SalesPage/></Permit>}/><Route path="/scanner" element={<Permit roles={["MECHANIC","WAREHOUSE","SALES","ADMIN"]}><ScannerPage/></Permit>}/><Route path="/users" element={<Permit roles={["ADMIN"]}><UsersPage/></Permit>}/><Route path="/audit" element={<Permit roles={["MANAGER","ADMIN"]}><AuditPage/></Permit>}/><Route path="*" element={<Home/>}/></Route></Route></Routes></Suspense>;}
export default App;






