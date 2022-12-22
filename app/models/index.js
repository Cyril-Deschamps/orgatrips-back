import { readdirSync } from "fs";
import { join } from "path";
import mainSequelize from "sequelize";
import Model from "./model";
import loggerFactory from "../log";
const logger = loggerFactory(import.meta.url); // use default logger set up in log.js
import { db } from "../config/config.js";
import url from "url";
import "core-js/features/string/replace-all";

mainSequelize.Model = Model;
const { Sequelize } = mainSequelize;

const sequelize = new Sequelize(db.database, db.user, db.password, {
  host: db.host,
  dialect: "mariadb",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  logging: (l, o) =>
    o.bind ? logger.debug(l.replaceAll("?", "%s"), ...o.bind) : logger.debug(l),
});

async function importDir(dir) {
  await Promise.all(
    readdirSync(dir, { withFileTypes: true })
      .filter(
        (file) =>
          file.name.slice(-9) === ".model.js" ||
          (file.isDirectory() && file.name.charAt(0) !== "."),
      )
      .map((file) =>
        file.isDirectory()
          ? importDir(join(dir, file.name))
          : import(join(dir, file.name)).then((module) =>
              module.default(sequelize),
            ),
      ),
  );
}

await importDir(url.fileURLToPath(new URL(".", import.meta.url)));

Object.values(sequelize.models).forEach((model) => {
  if (model.associate) {
    model.associate(sequelize.models);
  }
});

// CONNECT TO BD -- SYNCHRONIZATION
// =============================================================================
sequelize.authenticate().then(
  () => {
    logger.debug("Connection has been established successfully.");
  },
  (err) => {
    logger.error("Unable to connect to the database: %o", err);
  },
);

export const models = sequelize.models;
export default sequelize;
