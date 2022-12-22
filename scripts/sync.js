#!usr/bin/env node
import sequelize from "../app/models";
import loggerFactory from "../app/log";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("alter", {
    type: "boolean",
    description: "USE WITH CAUTION !!\nRun synchronization in sql alter mode.",
  })
  .option("drop", {
    type: "boolean",
    description:
      "USE WITH CAUTION !!\nRun synchronisation in sql alter mode with drop statements.",
    default: false,
  }).argv;

const logger = loggerFactory(import.meta.url);

try {
  await sequelize
    .sync({ alter: argv.alter ? { drop: argv.drop } : false })
    .then(
      () => {
        logger.debug("Successfully synchronized with DB");
      },
      (err) => {
        logger.error("Error while synchronizing with DB %o", err);
      },
    );
} catch (e) {
  logger.error(e);
} finally {
  await sequelize.close();
}
