import fs from "fs";
import { copyFile } from "fs/promises";
import log from "../log";
import crypto from "crypto";
import Mime from "mime";
import nodePath from "path";
import sharp from "sharp";
const logger = log(import.meta.url);

export const HASH_SIZE = 40;

export function removeBase64Header(base64) {
  return base64.replace(/^data:\w+\/[^;]+(?:;filename=\w+\.\w+)?;base64,/, "");
}

export function writeFile(file, path, name) {
  const data = removeBase64Header(file);
  const extension = Mime.getExtension(
    file.match(/^data:(?<type>\w+\/[^;]+)(?:;filename=\w+\.\w+)?;base64,.*/)
      .groups.type,
  );
  const filename = name + "." + extension;
  const pathName = nodePath.join(path, filename);
  return new Promise((resolve, reject) => {
    logger.debug("path: %o", path);
    fs.mkdir(path, { recursive: true }, (err) => {
      if (!err) {
        fs.writeFile(pathName, data, { encoding: "base64" }, (err) => {
          if (err) {
            logger.error("%O", err);
            return reject(err);
          }
          return resolve(filename);
        });
      } else {
        return reject(err);
      }
    });
  });
}

export function writeFileCompressed(file, path, name, compressionOptions) {
  const data = removeBase64Header(file);
  const filename = name + ".jpg"; //+ extension;
  const pathName = nodePath.join(path, filename);
  return new Promise((resolve, reject) => {
    logger.debug("path: %o", path);
    fs.mkdir(path, { recursive: true }, (err) => {
      if (!err) {
        const buf = Buffer.from(data, "base64");
        sharp(buf)
          .resize({ width: compressionOptions?.width || 1000 })
          .jpeg({ quality: compressionOptions?.quality || 60, force: true })
          .toFile(pathName, (err) => {
            if (err) {
              logger.error("%O", err);
              return reject(err);
            }
            resolve(filename);
          });
      } else {
        return reject(err);
      }
    });
  });
}

/**
 *
 * @param {string|function} prefix
 * @param {object} instance sequelize obj
 * @return string
 */
function getPrefixValue(prefix, instance) {
  if (typeof prefix === "string") return prefix;
  else if (typeof prefix === "function") return prefix(instance);
  return "";
}

/**
 * Do not forget to add 'individualHooks: true' on multiple queries options to ensure that this will run.
 *
 * @param {string} attributeName
 * @param {string|function} path
 * @param {string|function} prefix
 * @param {function=} validate
 * @param {{quality?: number, width?: number}} compressionOptions
 * @returns {function(...[*]=)}
 */
export function modelFileWriter(
  attributeName,
  path,
  prefix,
  validate,
  compressionOptions,
) {
  return (instance, options) => {
    if (!instance.changed(attributeName)) return;
    const filename = instance._previousDataValues[attributeName];
    const file = instance.getDataValue(attributeName);
    if (file && file.startsWith("data:") && file !== filename) {
      return Promise.resolve(
        validate &&
          validate(
            file.match(
              /^data:(?<type>\w+\/[^;]+)(?:;filename=\w+\.\w+)?;base64,.*/,
            ).groups.type, // Mime type
            Buffer.from(file, "base64"), // Buffer object
          ),
      ).then(async () => {
        const hash = crypto.createHash("sha1");
        hash.setEncoding("hex");
        hash.write(file);
        hash.end();
        const name = getPrefixValue(prefix, instance) + hash.read();

        if (filename && filename !== name) {
          await instance.constructor
            .findAll({
              where: {
                [attributeName]: filename,
              },
              transaction: options.transaction,
            })
            .then((instances) => {
              const currentPath =
                typeof path === "function" ? path(instance) : path;

              if (
                (typeof path === "function"
                  ? instances
                      .map((i) => path(i))
                      .filter((p) => p === currentPath)
                  : instances
                ).length -
                  1 ===
                0
              ) {
                const p = nodePath.join(currentPath, filename);
                logger.info("Deleting : %s", p);
                fs.unlink(p, (err) => {
                  if (err) logger.error("%O", err);
                });
              }
            });
        }
        if (compressionOptions) {
          return writeFileCompressed(
            file,
            typeof path === "function" ? path(instance) : path,
            name,
            compressionOptions,
          ).then((createdName) => {
            instance[attributeName] = createdName;
            return Promise.resolve();
          });
        }

        return writeFile(
          file,
          typeof path === "function" ? path(instance) : path,
          name,
        ).then((createdName) => {
          instance[attributeName] = createdName;
          return Promise.resolve();
        });
      });
    } else if (file === null && file !== filename && filename) {
      return instance.constructor
        .findAll({
          where: {
            [attributeName]: filename,
          },
          transaction: options.transaction,
        })
        .then((instances) => {
          const currentPath =
            typeof path === "function" ? path(instance) : path;

          if (
            (typeof path === "function"
              ? instances.map((i) => path(i)).filter((p) => p === currentPath)
              : instances
            ).length -
              1 ===
            0
          ) {
            const p = nodePath.join(currentPath, filename);
            logger.info("Deleting : %s", p);
            fs.unlink(p, (err) => {
              if (err) logger.error("%O", err);
            });
            return Promise.resolve();
          }
        });
    }
  };
}

export function modelFileDeleter(attributeName, path) {
  return async (instance, options) => {
    const filename = instance.getDataValue(attributeName);
    if (filename) {
      const count = await options.model.count({
        where: {
          [attributeName]: filename,
        },
      });
      if (count - 1 === 0) {
        const p = nodePath.join(
          typeof path === "function" ? path(instance) : path,
          filename,
        );
        logger.info("Deleting : %s", p);
        fs.unlink(p, (err) => {
          logger.error("%O", err);
        });
      }
    }
  };
}

export function downloadFile(req, res) {
  res.header("Access-Control-Expose-Headers", "Content-Disposition");
  res.download(req.file.path, req.file.name);
}

export function copyFileFromPattern(pattern, attributeName, getReference) {
  return async (instance, options) => {
    if (!instance.changed(attributeName)) return;
    const filename = instance.getDataValue(attributeName);
    const previousValue = instance._previousDataValues[attributeName];
    let match;
    if (
      filename &&
      filename !== previousValue &&
      (match = filename.match(pattern))
    ) {
      const ref = await getReference(match, instance, options);
      logger.debug(
        "Copying file %s to %s",
        ref.from,
        nodePath.join(ref.path, ref.name),
      );
      await copyFile(ref.from, nodePath.join(ref.path, ref.name));
      instance[attributeName] = ref.name;
      instance._changed[attributeName] = true;
    }
  };
}

export function ignoreAttribute(attributeName) {
  return (instance) => {
    instance[attributeName] = instance.previous(attributeName);
  };
}

export function ignoreURL(attributeName, callback) {
  return callback
    ? (instance, options) => {
        if (
          instance.changed(attributeName) &&
          instance.getDataValue(attributeName) &&
          instance.getDataValue(attributeName).startsWith("http")
        ) {
          return ignoreAttribute(attributeName)(instance, options);
        }
        return callback(instance, options);
      }
    : (instance, options) => {
        if (
          instance.changed(attributeName) &&
          instance[attributeName] &&
          instance[attributeName].startsWith("http")
        ) {
          return ignoreAttribute(attributeName)(instance, options);
        }
        return Promise.resolve();
      };
}
