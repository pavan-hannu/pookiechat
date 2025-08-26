import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

export function setApiBase(url: string) {
  (api.defaults.baseURL as any) = url;
}
