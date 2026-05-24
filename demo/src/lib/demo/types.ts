export type DemoScene = "drive" | "balance-check" | "success" | "toll" | "stat";

export type DemoState = {
  t: number;
  distance: number;
  scene: DemoScene;
  alertFired: boolean;
  balanceCheckStarted: boolean;
  ctaTapped: boolean;
  upiTapped: boolean;
  arrived: boolean;
  disasterShown: boolean;
  hornFired: boolean;
  done: boolean;
  soundOn: boolean;
  selectedAmount: number;
  selectedUpi: string;
  scrollOffset: number;
  alertAt: number | null;
  sheetAt: number | null;
  balanceCheckAt: number | null;
};

export type DemoAction =
  | { type: "tick"; dt: number }
  | { type: "reset" }
  | { type: "skip-to-alert" }
  | { type: "open-sheet" }
  | { type: "start-balance-check" }
  | { type: "complete-balance-check" }
  | { type: "tap-upi"; upi: string }
  | { type: "go-success" }
  | { type: "go-toll" }
  | { type: "go-stat" }
  | { type: "toggle-sound" }
  | { type: "set-arrived" };
