// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
import { app } from "../app"; // call app

import {
  port,
  logDirectory,
  apiPath,
  back,
  docPath,
} from "../app/config/config.js";
import loggerFactory from "../app/log.js";
const logger = loggerFactory(import.meta.url);

// START THE SERVER
// =============================================================================
app.listen(port);
logger.debug("Magic happens on port " + port);
logger.debug("logDirectory " + logDirectory);
logger.debug(`API is available at "${new URL(apiPath, back)}".`);
logger.debug(`API doc is available at "${new URL(docPath, back)}".`);
