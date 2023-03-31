import { models } from "../models";
import {
  bulkSearchTransportationsAndFormatTrips,
  validAccomodationBudgetAndFormatTrip,
  addOtherBudgetAndFormatTrip,
} from "../services/tripService";
import loggerFactory from "../log";
import sequelize from "sequelize";
import { differenceInDays } from "date-fns";
import { join } from "path";
import { cityPicMediaPath } from "../config/config";
const { Op } = sequelize;
const logger = loggerFactory(import.meta.url);

export async function searchTrips(req, res, next) {
  let searchParams;
  try {
    searchParams = {
      departureCityOrIataCode: req.body.departureCity,
      locale: req.body.locale,
      startDate: new Date(req.body.dateRange.startDate),
      endDate: new Date(req.body.dateRange.endDate),
      budgetMax: parseInt(req.body.budgetMax),
      adultsNumber: parseInt(req.body.adultsNumber),
      childrenNumber: parseInt(req.body.childrenNumber),
    };

    const cities = await models.City.findAll({
      limit: 200,
      order: [["kiwi_dst_popularity_score", "DESC"]],
      where: {
        slug: { [Op.not]: searchParams.departureCityOrIataCode },
        code: { [Op.not]: searchParams.departureCityOrIataCode },
      },
    });

    let trips = await bulkSearchTransportationsAndFormatTrips({
      cities,
      ...searchParams,
    });

    const citiesEnumByCode = cities.reduce((citiesEnum, city) => {
      citiesEnum[city.code] = city;
      return citiesEnum;
    }, {});

    trips = trips.flatMap((trip) =>
      validAccomodationBudgetAndFormatTrip(
        trip,
        citiesEnumByCode[trip.destinationCityCode],
        searchParams.adultsNumber + searchParams.childrenNumber,
        differenceInDays(searchParams.endDate, searchParams.startDate),
        searchParams.budgetMax,
      ),
    );

    trips = trips
      .map((trip) => addOtherBudgetAndFormatTrip(trip))
      .sort((a, b) => b.popularity - a.popularity);

    models.SearchTripsAnalytic.create({ ...searchParams });

    return res.status(200).send(trips);
  } catch (e) {
    logger.error(`Search destinations error : ${e}`);
    try {
      if (e.isAxiosError) {
        if (e.response.status === 422) {
          models.SearchTripsAnalytic.create({
            ...searchParams,
            error: "airport_not_compatible",
          });
          return res.sendStatus(422);
        }
      }
    } catch (eA) {
      logger.error(`Save error analytics error : ${eA}`);
    }
    models.SearchTripsAnalytic.create({
      ...searchParams,
      error: "maybe_timeout",
    });
    next(e);
  }
}

export async function accessCityPic(req, res, next) {
  try {
    const city = await models.City.findByPk(req.params.city_id, {
      fields: ["cityPic"],
    });
    if (!city || !city.cityPic) return res.sendStatus(404);

    req.file = {
      path: join(cityPicMediaPath, city.getDataValue("cityPic")),
    };
    next();
  } catch (error) {
    next(error);
  }
}
