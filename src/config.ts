import * as dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  serviceHost: process.env.NFC_SERVICE_HOST ?? "127.0.0.1",
  servicePort: toNumber(process.env.NFC_SERVICE_PORT, 5139),
  writeEnabled: (process.env.NFC_WRITE_ENABLED ?? "true").toLowerCase() === "true",
  bridgeToken: process.env.NFC_BRIDGE_TOKEN ?? "",
  tokenPrefix: process.env.NFC_TOKEN_PREFIX ?? "rp_badge_",
  tokenBytes: toNumber(process.env.NFC_TOKEN_BYTES, 12),
  ndefStartBlock: toNumber(process.env.NFC_NDEF_START_BLOCK, 4),
  ndefBlockSize: toNumber(process.env.NFC_NDEF_BLOCK_SIZE, 4),
  ndefMaxBytes: toNumber(process.env.NFC_NDEF_MAX_BYTES, 48),
};
