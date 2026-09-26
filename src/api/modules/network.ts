import http from "@/api";

export interface NetworkReport {
  message: string;
  normal: boolean;
  probes: { address: string; reachable: boolean }[];
}

export const checkNetwork = () => http.post<NetworkReport>("/hr/network/check", {}, { timeout: 25000 });
