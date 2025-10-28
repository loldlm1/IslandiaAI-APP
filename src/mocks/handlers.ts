import { authHandlers } from "./handlers/auth";
import { dashboardHandlers } from "./handlers/dashboard";

export const handlers = [...authHandlers, ...dashboardHandlers];
