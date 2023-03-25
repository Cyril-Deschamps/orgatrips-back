import { models } from "../models";
import {
  bulkSearchTransportationsAndFormatTrips,
  validAccomodationBudgetAndFormatTrip,
  addOtherBudgetAndFormatTrip,
} from "../services/tripService";
import loggerFactory from "../log";
import sequelize from "sequelize";
import { differenceInDays } from "date-fns";
const { Op } = sequelize;
const logger = loggerFactory(import.meta.url);

export async function searchTrips(req, res, next) {
  try {
    const searchParams = {
      departureCity: req.body.departureCity,
      locale: req.body.locale,
      startDate: new Date(req.body.dateRange.startDate),
      endDate: new Date(req.body.dateRange.endDate),
      budgetMax: parseInt(req.body.budgetMax),
      adultsNumber: parseInt(req.body.adultsNumber),
      childrenNumber: parseInt(req.body.childrenNumber),
    };

    const [cities] = await Promise.all([
      models.City.findAll({
        limit: 200,
        order: [["kiwi_dst_popularity_score", "DESC"]],
        where: { slug: { [Op.not]: searchParams.departureCity } },
      }),
      models.SearchTripsAnalytic.create(searchParams),
    ]);

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

    return res.status(200).send(trips);
  } catch (e) {
    logger.info(`Search destinations error : ${e}`);
    next(e);
  }
}
