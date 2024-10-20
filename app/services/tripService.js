import axios from "axios";
import { format } from "date-fns";
import { tripBudgetPercentage } from "../config/config";

export const searchTransportations = async ({
  adultsNumber,
  budgetMax,
  childrenNumber,
  cities,
  departureIataCode,
  endDate,
  locale,
  startDate,
}) => {
  const baseUrl = "https://api.tequila.kiwi.com/v2/search";
  const params = {
    locale,
    fly_from: departureIataCode,
    fly_to: cities,
    date_from: startDate,
    date_to: startDate,
    return_from: endDate,
    return_to: endDate,
    price_from: 0,
    price_to: budgetMax,
    vehicle_type: "aircraft,bus,train",
    adults: adultsNumber,
    children: childrenNumber,
    partner_market: "us",
    limit: 1000,
    one_for_city: 1,
    ret_to_diff_airport: false,
    ret_from_diff_airport: false,
    max_stopovers: 2,
    curr: "USD",
    nights_in_dst_from: 1,
    nights_in_dst_to: 365,
  };

  const response = await axios.get(baseUrl, {
    params,
    headers: {
      apikey: process.env.APP_KIWI_PUBLIC_KEY,
    },
  });

  return response.data;
};

/**
 * Search transportations with cities in database
 * We split request because Kiwi API not works fine with too many destinations.
 * @returns Returns trips list.
 */
export const bulkSearchTransportationsAndFormatTrips = async ({
  adultsNumber,
  budgetMax,
  childrenNumber,
  cities,
  departureIataCode,
  endDate,
  locale,
  startDate,
}) => {
  const promises = [];

  const batchSize = 200;
  const numberOfBatches = Math.ceil(cities.length / batchSize);
  for (let i = 0; i < numberOfBatches; i++) {
    const start = i * batchSize;
    const end = start + batchSize;
    const citiesBatch = cities.slice(start, end);
    promises.push(
      searchTransportations({
        cities: citiesBatch.map((destination) => destination.code).join(","),
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        locale,
        budgetMax: Math.round(
          budgetMax * tripBudgetPercentage.transportation +
            budgetMax * tripBudgetPercentage.accomodation,
        ),
        departureIataCode,
        adultsNumber,
        childrenNumber,
      }).then((data) =>
        data.data.map((destination) => {
          const inboundSteps = destination.route.filter(
            (step) => step.return === 0,
          );
          const outboundSteps = destination.route.filter(
            (step) => step.return === 1,
          );
          const city = citiesBatch.find(
            (city) =>
              city.code.toUpperCase() === destination.cityCodeTo.toUpperCase(),
          );
          return {
            // Follow trip model schema
            DestinationCity: city,
            nightsNumber: destination.nightsInDest,
            travelersNumber: adultsNumber + childrenNumber,
            transportationPrice: destination.price,
            transportationBookingToken: destination.booking_token,
            transportationInboundDuration:
              destination.duration.departure * 1000,
            transportationOutboundDuration: destination.duration.return * 1000,
            transportationStopOverInbound: inboundSteps.length - 1,
            transportationStopOverOutbound: outboundSteps.length - 1,
            transportationDepartureDate: inboundSteps[0].utc_departure,
            transportationReturnDate:
              outboundSteps[outboundSteps.length - 1].utc_arrival,
            transportationArrivalLocalDate:
              inboundSteps[inboundSteps.length - 1].local_arrival,
            transportationLeavingLocalDate: outboundSteps[0].local_departure,
          };
        }),
      ),
    );
  }

  const formatedDestinations = await Promise.all(promises);

  return formatedDestinations
    .flat()
    .filter((trip) => trip.DestinationCity !== undefined);
};

/**
 * Valid accomodation price in destination and add price to the trip
 * @returns Returns trip with accomodation price or [] if budget not correspond.
 */
export const calculValidAccomodationBudget = (trip, budgetMax) => {
  // Accomodation price percentage depending on the percentage of price used by transport
  const accomodationPricePecentage =
    tripBudgetPercentage.transportation -
    trip.transportationPrice / budgetMax +
    tripBudgetPercentage.accomodation;

  const accomodationTotalBudgetMax = budgetMax * accomodationPricePecentage;

  const accomodationMinPricePerNight =
    (trip.travelersNumber === 1
      ? trip.DestinationCity.soloPricePerPersonMin
      : trip.DestinationCity.multiplePricePerPersonMin) * trip.travelersNumber;
  const accomodationMaxPricePerNight =
    (trip.travelersNumber === 1
      ? trip.DestinationCity.soloPricePerPersonMax
      : trip.DestinationCity.multiplePricePerPersonMax) * trip.travelersNumber;

  if (
    accomodationTotalBudgetMax >
    accomodationMinPricePerNight * trip.nightsNumber
  ) {
    const averagePricePerNight = Math.round(
      (accomodationMinPricePerNight * 3 +
        Math.min(
          accomodationMaxPricePerNight,
          accomodationTotalBudgetMax / trip.nightsNumber,
        )) /
        4,
    );

    return averagePricePerNight;
  }

  return null;
};

export const calculOtherBudgets = (trip) => {
  const accomodationAndTransportPrice =
    trip.transportationPrice +
    trip.accomodationAveragePricePerNight * trip.nightsNumber;

  const theoricalOtherBudget = Math.round(
    (accomodationAndTransportPrice /
      (tripBudgetPercentage.transportation +
        tripBudgetPercentage.accomodation)) *
      (1 -
        tripBudgetPercentage.transportation -
        tripBudgetPercentage.accomodation),
  );

  const hypoteticalOtherBudget =
    process.env.APP_OTHER_BUDGET_PER_DAY *
    trip.nightsNumber *
    trip.travelersNumber;

  const maxOtherBudget =
    (Math.min(theoricalOtherBudget, hypoteticalOtherBudget) +
      hypoteticalOtherBudget) /
    2;

  return {
    otherSpentBudget: maxOtherBudget,
    totalBudget: accomodationAndTransportPrice + maxOtherBudget,
  };
};
