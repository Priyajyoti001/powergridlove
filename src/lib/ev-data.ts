// Illustrative datasets compiled from public trends (Vahan, BEE, NITI Aayog). Values are approximate.
export type StationStatus = "available" | "busy" | "construction" | "potential";

export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  status: StationStatus;
  chargers: number;
  inUse: number;
  powerKw: number;
  operator: string;
}

const CITIES: [string, string, number, number, number][] = [
  ["New Delhi", "Delhi", 28.6139, 77.209, 14],
  ["Mumbai", "Maharashtra", 19.076, 72.8777, 13],
  ["Pune", "Maharashtra", 18.5204, 73.8567, 9],
  ["Bengaluru", "Karnataka", 12.9716, 77.5946, 14],
  ["Mysuru", "Karnataka", 12.2958, 76.6394, 4],
  ["Chennai", "Tamil Nadu", 13.0827, 80.2707, 10],
  ["Coimbatore", "Tamil Nadu", 11.0168, 76.9558, 5],
  ["Hyderabad", "Telangana", 17.385, 78.4867, 11],
  ["Kolkata", "West Bengal", 22.5726, 88.3639, 7],
  ["Ahmedabad", "Gujarat", 23.0225, 72.5714, 8],
  ["Surat", "Gujarat", 21.1702, 72.8311, 5],
  ["Jaipur", "Rajasthan", 26.9124, 75.7873, 6],
  ["Lucknow", "Uttar Pradesh", 26.8467, 80.9462, 6],
  ["Noida", "Uttar Pradesh", 28.5355, 77.391, 6],
  ["Gurugram", "Haryana", 28.4595, 77.0266, 7],
  ["Chandigarh", "Chandigarh", 30.7333, 76.7794, 4],
  ["Kochi", "Kerala", 9.9312, 76.2673, 5],
  ["Thiruvananthapuram", "Kerala", 8.5241, 76.9366, 4],
  ["Bhopal", "Madhya Pradesh", 23.2599, 77.4126, 4],
  ["Indore", "Madhya Pradesh", 22.7196, 75.8577, 4],
  ["Bhubaneswar", "Odisha", 20.2961, 85.8245, 4],
  ["Patna", "Bihar", 25.5941, 85.1376, 3],
  ["Guwahati", "Assam", 26.1445, 91.7362, 3],
  ["Nagpur", "Maharashtra", 21.1458, 79.0882, 4],
  ["Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185, 4],
  ["Dehradun", "Uttarakhand", 30.3165, 78.0322, 3],
  ["Ranchi", "Jharkhand", 23.3441, 85.3096, 3],
  ["Raipur", "Chhattisgarh", 21.2514, 81.6296, 3],
  ["Goa", "Goa", 15.4909, 73.8278, 3],
  ["Amritsar", "Punjab", 31.634, 74.8723, 3],
];
const OPERATORS = ["Tata Power EZ", "Statiq", "ChargeZone", "Jio-bp Pulse", "Ather Grid", "EESL", "Zeon", "GLIDA"];
const AREAS = ["Central", "Ring Road", "Tech Park", "Mall", "Highway Plaza", "Metro Hub", "Airport", "Market", "Station Rd", "Sector"];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

let cache: Station[] | null = null;
export function getStations(): Station[] {
  if (cache) return cache;
  const r = rng(42);
  const out: Station[] = [];
  CITIES.forEach(([city, state, lat, lng, n]) => {
    for (let i = 0; i < n; i++) {
      const roll = r();
      const status: StationStatus = roll < 0.5 ? "available" : roll < 0.75 ? "busy" : roll < 0.88 ? "construction" : "potential";
      const chargers = 2 + Math.floor(r() * 10);
      const inUse = status === "busy" ? chargers - Math.floor(r() * 2) : status === "available" ? Math.floor(r() * chargers * 0.6) : 0;
      out.push({
        id: `${city.slice(0, 3).toUpperCase()}-${i + 1}`,
        name: `${OPERATORS[Math.floor(r() * OPERATORS.length)]} · ${AREAS[Math.floor(r() * AREAS.length)]}`,
        city,
        state,
        lat: lat + (r() - 0.5) * 0.18,
        lng: lng + (r() - 0.5) * 0.18,
        status,
        chargers,
        inUse,
        powerKw: [7.4, 22, 30, 60, 120, 240][Math.floor(r() * 6)] ?? 22,
        operator: OPERATORS[Math.floor(r() * OPERATORS.length)] ?? "EESL",
      });
    }
  });
  cache = out;
  return out;
}

export const NATIONAL = { total: 29277, available: 21840, construction: 4120, potential: 18500 };

export const crowdByHour = [
  { hour: "6a", crowd: 18 }, { hour: "8a", crowd: 52 }, { hour: "10a", crowd: 61 }, { hour: "12p", crowd: 48 },
  { hour: "2p", crowd: 44 }, { hour: "4p", crowd: 58 }, { hour: "6p", crowd: 86 }, { hour: "8p", crowd: 92 },
  { hour: "10p", crowd: 63 }, { hour: "12a", crowd: 27 },
];

export const topStates = [
  { state: "Maharashtra", stations: 3728 }, { state: "Delhi", stations: 1951 }, { state: "Karnataka", stations: 5765 },
  { state: "Uttar Pradesh", stations: 1989 }, { state: "Tamil Nadu", stations: 1413 }, { state: "Telangana", stations: 1369 },
  { state: "Kerala", stations: 1212 }, { state: "Gujarat", stations: 1031 },
].sort((a, b) => b.stations - a.stations);

export const statusShare = [
  { name: "Available", value: 62 }, { name: "Busy", value: 23 }, { name: "Offline", value: 5 }, { name: "Construction", value: 10 },
];

export const chargerTypes = [
  { name: "AC Slow (≤22kW)", value: 58 }, { name: "DC Fast (30–60kW)", value: 31 }, { name: "Ultra (≥120kW)", value: 11 },
];

export const salesFY = [
  { fy: "FY20", actual: 0.17, projected: 0.17 }, { fy: "FY21", actual: 0.12, projected: 0.2 },
  { fy: "FY22", actual: 0.46, projected: 0.4 }, { fy: "FY23", actual: 1.17, projected: 0.9 },
  { fy: "FY24", actual: 1.67, projected: 1.6 }, { fy: "FY25", actual: 1.96, projected: 2.1 },
  { fy: "FY26", actual: 2.4, projected: 2.7 }, { fy: "FY27", projected: 3.5 },
  { fy: "FY28", projected: 4.6 }, { fy: "FY29", projected: 6.0 }, { fy: "FY30", projected: 8.0 },
];

export const vehicleShare = [
  { name: "2-Wheelers", value: 59 }, { name: "3-Wheelers", value: 34 }, { name: "Cars (4W)", value: 6 }, { name: "Buses & Others", value: 1 },
];

export const registrationGrowth = [
  { month: "Apr", y24: 116, y25: 129 }, { month: "May", y24: 123, y25: 141 }, { month: "Jun", y24: 112, y25: 148 },
  { month: "Jul", y24: 152, y25: 165 }, { month: "Aug", y24: 157, y25: 172 }, { month: "Sep", y24: 151, y25: 184 },
  { month: "Oct", y24: 218, y25: 236 }, { month: "Nov", y24: 156, y25: 198 }, { month: "Dec", y24: 150, y25: 192 },
];

export const industryGrowth = [
  { year: "2020", market: 0.4, investment: 0.2 }, { year: "2022", market: 2.1, investment: 1.1 },
  { year: "2024", market: 5.6, investment: 3.4 }, { year: "2026", market: 11.8, investment: 6.9 },
  { year: "2028", market: 24.5, investment: 12.2 }, { year: "2030", market: 45.0, investment: 20.0 },
];

export const stateGrowth = [
  { state: "UP", growth: 42, penetration: 11.2 }, { state: "MH", growth: 38, penetration: 8.4 },
  { state: "KA", growth: 35, penetration: 9.1 }, { state: "TN", growth: 31, penetration: 6.9 },
  { state: "DL", growth: 29, penetration: 12.1 }, { state: "RJ", growth: 27, penetration: 7.2 },
  { state: "GJ", growth: 25, penetration: 5.6 }, { state: "KL", growth: 34, penetration: 7.8 },
  { state: "BR", growth: 40, penetration: 9.8 }, { state: "TS", growth: 30, penetration: 6.1 },
];

export interface ReportResource {
  title: string;
  org: string;
  year: number | null;
  tag: string;
  url: string;
  action: string;
}

// Only include publisher destinations whose content and successful GET response
// were verified. Live dashboards have no fabricated publication year.
export const reports: ReportResource[] = [
  { title: "Guidelines for Installation and Operation of Electric Vehicle Charging Infrastructure 2024", org: "Ministry of Power · Bureau of Energy Efficiency", year: 2024, tag: "Policy", url: "https://neca.beeindia.gov.in/show_content.php?lang=1&level=1&lid=35&ls_id=91", action: "Open guidelines" },
  { title: "PM E-DRIVE Scheme", org: "Ministry of Heavy Industries", year: 2024, tag: "Policy", url: "https://pmedrive.heavyindustries.gov.in/", action: "Open scheme" },
  { title: "India's Electric Mobility Transformation: Progress to Date and Future Opportunities", org: "NITI Aayog & RMI", year: 2019, tag: "Research", url: "https://rmi.org/resources/indias-electric-mobility-transformation/", action: "Open report" },
  { title: "Global EV Outlook 2025", org: "International Energy Agency", year: 2025, tag: "Global", url: "https://iea.blob.core.windows.net/assets/7ea38b60-3033-42a6-9589-71134f4229f4/GlobalEVOutlook2025.pdf", action: "Open PDF" },
  { title: "VAHAN Public Dashboard — Vehicle Registrations", org: "Ministry of Road Transport and Highways", year: null, tag: "Data", url: "https://analytics.parivahan.gov.in/analytics/publicdashboard/vahan?lang=en", action: "Open dashboard" },
];
