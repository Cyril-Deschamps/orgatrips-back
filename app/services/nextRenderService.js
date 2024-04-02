import axios from "axios";
import { front, frontWebhookSecret } from "../config/config";
import loggerFactory from "../log";
const logger = loggerFactory(import.meta.url);

export async function reloadPaths(pathname) {
  try {
    await axios.post(`${front}/api/reloadPrerendering`, {
      pathname,
      secret: frontWebhookSecret,
    });
  } catch (e) {
    logger.error("Failed reload NextJS prerendering");
  }
  return;
}
