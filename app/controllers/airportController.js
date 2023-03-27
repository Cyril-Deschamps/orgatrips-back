import { models } from "../models";
import loggerFactory from "../log";
import { Sequelize } from "sequelize";
import geoip from "geoip-lite";
import { AIRPORT_TYPE } from "../models/airport.model";
const logger = loggerFactory(import.meta.url);

export async function findAirports(req, res, next) {
  try {
    const ip = req.headers["x-real-ip"];
    const geo = geoip.lookup(ip) || { ll: ["40.73", "-73.93"] };

    let airports = [];
    let searchParams = null;
    if (req.query.query) {
      searchParams = {
        query: req.query.query
          .split(/[\s+\-<>()~*"]+/)
          .flatMap((term) => (term.length > 1 ? [`+${term}*`] : []))
          .join(" "),
      };
    }

    if (searchParams?.query) {
      airports = await models.Airport.findAll({
        attributes: [
          "iataCode",
          "name",
          "city",
          "countryCode",
          "lat",
          "lon",
          "type",
          [
            Sequelize.fn(
              "ROUND",
              Sequelize.fn(
                "ST_Distance_Sphere",
                Sequelize.fn(
                  "POINT",
                  Sequelize.col("Airport.lon"),
                  Sequelize.col("Airport.lat"),
                ),
                Sequelize.fn("POINT", geo.ll[1], geo.ll[0]),
              ),
              -5,
            ),
            "distance",
          ],
        ],
        limit: 5,
        where: Sequelize.literal(
          "MATCH (`name`, `city`) AGAINST (:query IN BOOLEAN MODE)",
        ),
        order: [Sequelize.literal("distance ASC"), ["type", "DESC"]],
        replacements: {
          query: searchParams.query,
        },
      });
    } else {
      airports = await models.Airport.findAll({
        attributes: [
          "iataCode",
          "name",
          "city",
          "countryCode",
          "lat",
          "lon",
          "type",
          [
            Sequelize.fn(
              "ROUND",
              Sequelize.fn(
                "ST_Distance_Sphere",
                Sequelize.fn(
                  "POINT",
                  Sequelize.col("Airport.lon"),
                  Sequelize.col("Airport.lat"),
                ),
                Sequelize.fn("POINT", geo.ll[1], geo.ll[0]),
              ),
              -5,
            ),
            "distance",
          ],
        ],
        where: { type: AIRPORT_TYPE.LARGE_AIRPORT },
        order: [Sequelize.literal("distance ASC"), ["type", "DESC"]],
        limit: 5,
      });
    }

    return res.status(200).send(airports);
  } catch (e) {
    logger.info(`Search destinations error : ${e}`);
    next(e);
  }
}
