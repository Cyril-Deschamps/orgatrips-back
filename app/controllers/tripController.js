import {
  bulkSearchTransportationsAndFormatTrips,
  calculValidAccomodationBudget,
  calculOtherBudgets,
} from "../services/tripService";
import loggerFactory from "../log";
const logger = loggerFactory(import.meta.url);
import { AppError, sendWebSocketError } from "../services/errorService";
import { getWss } from "../index";
import sequelize, { models } from "../models";

export async function searchTrips(req, res, next) {
  let searchParams;
  try {
    searchParams = {
      departureIataCode: req.body.departureIataCode,
      locale: req.body.locale,
      startDate: new Date(req.body.dateRange.startDate),
      endDate: new Date(req.body.dateRange.endDate),
      budgetMax: parseInt(req.body.budgetMax),
      adultsNumber: parseInt(req.body.adultsNumber),
      childrenNumber: parseInt(req.body.childrenNumber),
    };

    // Get the 200 most popular cities
    const cities = await models.City.findAll({
      limit: 200,
      order: [["kiwi_dst_popularity_score", "DESC"]],
    });

    let trips = await bulkSearchTransportationsAndFormatTrips({
      cities,
      ...searchParams,
    });

    // Add accomodation budget if corresponding to the budget
    // Else remove it from the list
    trips = trips.flatMap((trip) => {
      const accomodationBudget = calculValidAccomodationBudget(
        trip,
        searchParams.budgetMax,
      );
      return accomodationBudget === null
        ? []
        : [{ ...trip, accomodationAveragePricePerNight: accomodationBudget }];
    });

    // Get departure airport
    const departureAirport = await models.Airport.findOne({
      where: { iataCode: searchParams.departureIataCode },
    });

    // Add other budgets, departure airport and then sort by popularity
    trips = trips
      .map((trip) => ({
        ...trip,
        ...calculOtherBudgets(trip),
        DepartureAirport: departureAirport,
      }))
      .sort(
        (a, b) =>
          b.DestinationCity.kiwiDstPopularityScore -
          a.DestinationCity.kiwiDstPopularityScore,
      );

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

export async function getFeedTrips(req, res, next) {
  try {
    const trips = await models.Trip.findAll({
      attributes: {
        include: [
          [
            sequelize.fn("COUNT", sequelize.col("UserLike->likes.user_id")),
            "likesCount",
          ],
          [
            sequelize.literal(
              "(SELECT IF(COUNT(*) = 0, 0, 1) as hasAlreadyLike FROM likes WHERE user_id = :userId and trip_id = Trip.id)",
            ),
            "hasAlreadyLike",
          ],
        ],
      },
      include: [
        models.Trip.associations.DestinationCity,
        models.Trip.associations.DepartureAirport,
        { association: models.Trip.associations.UserLike, attributes: [] },
      ],
      group: ["id"],
      order: [["createdAt", "DESC"]],
      replacements: {
        userId: req.user?.id ?? null,
      },
    });
    return res.status(200).send(trips);
  } catch (e) {
    next(e);
  }
}

export async function getOwnTrips(req, res, next) {
  try {
    const trip = await req.user.getTrips({
      include: [
        models.Trip.associations.DestinationCity,
        models.Trip.associations.DepartureAirport,
      ],
    });
    return res.status(200).send(trip);
  } catch (e) {
    next(e);
  }
}

export async function saveTrip(req, res, next) {
  try {
    const trip = await req.user.createTrip({
      ...req.body,
      DepartureAirportIataCode: req.body.DepartureAirport.iataCode,
      DestinationCityId: req.body.DestinationCity.id,
    });
    sendRefreshDataNotification();
    return res.status(200).send(trip);
  } catch (e) {
    next(e);
  }
}

export async function unsaveTrip(req, res, next) {
  try {
    await models.Trip.destroy({
      where: { id: req.params.tripId, UserId: req.user.id },
    });
    sendRefreshDataNotification();
    return res.sendStatus(200);
  } catch (e) {
    next(e);
  }
}

// ##############################
// Websocket controllers
// ##############################

export const ReceivedLiveFeedMessageType = {
  LIKE: 0,
  UNLIKE: 1,
};

export const SendedLiveFeedMessageType = {
  ERROR: -1,
  REFRESH_DATA: 0,
};

/**
 * Handle websocket event coming from /liveFeed
 * @param { models.User  } user
 * @param ws : client websocket instance
 * @param rawData : stringified data schema : { type: ReceivedLiveFeedMessageType, params: Record<string, unknown> }
 */
export async function handleLiveFeedMessage(user, ws, rawData) {
  try {
    const data = JSON.parse(rawData);
    switch (data?.type) {
      case ReceivedLiveFeedMessageType.LIKE: {
        const trip = await models.Trip.findByPk(data.params.tripId);
        await user.addTripLike(trip);
        break;
      }
      case ReceivedLiveFeedMessageType.UNLIKE: {
        const trip = await models.Trip.findByPk(data.params.tripId);
        await user.removeTripLike(trip);
        break;
      }
      default:
        throw new AppError(422, "Unknown message type");
    }
    sendRefreshDataNotification();
  } catch (e) {
    sendWebSocketError(e, ws);
  }
}

export function sendRefreshDataNotification() {
  getWss().clients.forEach((ws) => {
    try {
      ws.send(
        JSON.stringify({
          type: SendedLiveFeedMessageType.REFRESH_DATA,
          params: {},
        }),
      );
    } catch (e) {
      sendWebSocketError(e, ws);
    }
  });
}
