import logo from "./logo.png";
import { LayoutDashboard, Map, FileWarning } from "lucide-react";

export const assets = {
  logo,
};

export const sidebarMenu = [
  { name: "Overview", path: "/overview", icon: LayoutDashboard },
  { name: "Live Incidents", path: "/map", icon: Map },
  { name: "Anonymous Reports", path: "/reports", icon: FileWarning },
];

export const adminSidebarMenu = [
  { name: "Overview", path: "/admin/overview", icon: LayoutDashboard },
  { name: "Live Incidents", path: "/admin/map", icon: Map },
  { name: "Anonymous Reports", path: "/admin/reports", icon: FileWarning },
];

export const statsData = [
  { title: "Total Alerts", value: "145", change: "↓ 12%", positive: false },
  { title: "Active SOS", value: "3", change: "↓ 2 New", positive: false },
  { title: "Resolved Today", value: "12", change: "↑ 8%", positive: true },
  {
    title: "Avg Response Time",
    value: "2m 14s",
    change: "↑ 15s",
    positive: true,
  },
];

export const incidentsData = [
  {
    id: "SOS-2023-001",
    source: "SOS App",
    timestamp: "Feb 9, 21:01",
    location: "9.0154, 38.7686",
    priority: "High",
    status: "Active",
  },
  {
    id: "SOS-2023-002",
    source: "SOS App",
    timestamp: "Feb 9, 20:48",
    location: "8.9854, 38.7536",
    priority: "High",
    status: "Acknowledged",
  },
  {
    id: "MAN-2023-045",
    source: "Manual",
    timestamp: "Feb 9, 20:03",
    location: "9.0104, 38.7436",
    priority: "Medium",
    status: "Resolved",
  },
  {
    id: "IOT-2023-012",
    source: "IoT Sensor",
    timestamp: "Feb 9, 17:03",
    location: "9.0354, 38.7836",
    priority: "Low",
    status: "Active",
  },
  {
    id: "IOT-2023-02",
    source: "IoT Sensor",
    timestamp: "Feb 9, 17:03",
    location: "9.0354, 38.7836",
    priority: "Low",
    status: "Resolved",
  },
  {
    id: "IOT-2022-012",
    source: "IoT Sensor",
    timestamp: "Feb 9, 17:03",
    location: "9.0354, 38.7836",
    priority: "Low",
    status: "Acknowledged",
  },
];

export const reportsData = [
  {
    id: "REP-101",
    date: "Feb 9, 2026 · 12:03",
    description:
      "I witnessed a domestic dispute at the apartment complex near kazanchis...",
    status: "Pending",
  },
  {
    id: "REP-102",
    date: "Feb 9, 2026 · 6:13",
    description:
      "Suspicious vehicle following students near the secondary school...",
    status: "Reviewed",
  },
  {
    id: "REP-103",
    date: "jan 19, 2026 · 11:03",
    description:
      "Suspicious vehicle following students near the secondary school...",
    status: "pending",
  },
  {
    id: "REP-104",
    date: "jan 7, 2026 · 1:30",
    description:
      "Suspicious vehicle following students near the secondary school...",
    status: "Reviewed",
  },
];

export const usersData = [
  {
    name: "Admin User",
    email: "admin@protego.gov.et",
    role: "System Admin",
    status: "Active",
  },
  {
    name: "Officer Bekele",
    email: "bekele@police.gov.et",
    role: "Responder",
    status: "Active",
  },
  {
    name: "Dispatcher Sarah",
    email: "sarah@emergency.gov.et",
    role: "Dispatcher",
    status: "Offline",
  },
];
