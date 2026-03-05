import { randomBytes } from "crypto";
import { config } from "./config";

export const generateBadgeToken = () => {
  const bytes = randomBytes(config.tokenBytes);
  return `${config.tokenPrefix}${bytes.toString("hex")}`;
};
