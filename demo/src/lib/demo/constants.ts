export const DEMO_TOTAL_SECONDS = 55;
export const START_DISTANCE_KM = 8;
export const ALERT_DISTANCE_KM = 5;
export const BASE_RATE_KM_S = 0.3;
export const ROAD_WIDTH = 360;
export const ROAD_WIDTH_SMALL = 280;

export const VEHICLE = {
  reg: "JK 01 AB 1234",
  model: "Tata Sumo",
  toll: "Lakhanpur",
  route: "Srinagar → Jammu · NH-44",
  balanceStart: 47,
  balanceAfter: 547,
  rechargeAmount: 500,
  tollFee: 95,
} as const;

export const DEMO_STEPS = [
  { id: "drive", label: "Drive", short: "1" },
  { id: "balance-check", label: "Check", short: "2" },
  { id: "success", label: "Recharge", short: "3" },
  { id: "toll", label: "Pass", short: "4" },
  { id: "stat", label: "Impact", short: "5" },
] as const;

export const BANKS = [
  { id: "icici", name: "ICICI Bank", color: "#F58220", initials: "IC" },
  { id: "hdfc", name: "HDFC Bank", color: "#004C8F", initials: "HD" },
  { id: "paytm", name: "Paytm Payments", color: "#00BAF2", initials: "PT" },
  { id: "sbi", name: "SBI FASTag", color: "#22409A", initials: "SB" },
] as const;

export const UPI_APPS = [
  { id: "phonepe", name: "PhonePe", handle: "9876…2451@ybl", initials: "Pe", className: "bg-[#5F259F]" },
  { id: "gpay", name: "Google Pay", handle: "9876…2451@okicici", initials: "G", className: "bg-white border border-[#E5E8EE] text-[#4285F4]" },
  { id: "paytm", name: "Paytm", handle: "9876…2451@paytm", initials: "P", className: "bg-gradient-to-br from-[#00BAF2] to-[#002970] text-white" },
] as const;

export const CAR_CONFIG = [
  { color: "#6FA8DC", roof: "#5A96C8", lane: 0, base: 18 },
  { color: "#82C99B", roof: "#6BB888", lane: 1, base: 28 },
  { color: "#B8BCC4", roof: "#A0A5AD", lane: 0, base: 38 },
  { color: "#F0F0EC", roof: "#D8D8D4", lane: 1, base: 52 },
  { color: "#7FB3D5", roof: "#6BA0C4", lane: 0, base: 68 },
  { color: "#9CA3AF", roof: "#868D98", lane: 1, base: 78 },
  { color: "#E8A838", roof: "#D4922A", lane: 0, base: 45 },
  { color: "#C47070", roof: "#A85858", lane: 1, base: 58 },
] as const;

export const SCENE_LABELS = {
  drive: "Driving toward toll",
  "balance-check": "Cross-bank readiness check",
  success: "Recharge confirmed",
  toll: "Passing through plaza",
  stat: "Chain reaction prevented",
} as const;

export const SCENE_ORDER = ["drive", "balance-check", "success", "toll", "stat"] as const;
