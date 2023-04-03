import axios from "axios";
import { format } from "date-fns";
import { tripBudgetPercentage } from "../config/config";

export const searchTransportations = async ({
  adultsNumber,
  budgetMax,
  childrenNumber,
  cities,
  departureCityOrIataCode,
  endDate,
  locale,
  startDate,
}) => {
  const baseUrl = "https://api.tequila.kiwi.com/v2/search";
  const params = {
    locale,
    fly_from: departureCityOrIataCode,
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
  departureCityOrIataCode,
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
        cities: citiesBatch.map((destination) => destination.slug).join(","),
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        locale,
        budgetMax:
          budgetMax * tripBudgetPercentage.transportation +
          budgetMax * tripBudgetPercentage.accomodation,
        departureCityOrIataCode,
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
          return {
            destinationName: destination.cityTo,
            destinationCityCode: destination.cityCodeTo,
            destinationCountryCode: destination.countryTo.code,
            nightsNumber: destination.nightsInDest,
            travelersNumber: adultsNumber + childrenNumber,
            Transportation: {
              price: destination.price,
              bookingToken: destination.booking_token,
              inboundDuration: destination.duration.departure * 1000,
              outboundDuration: destination.duration.return * 1000,
              stopOverInbound: inboundSteps.length - 1,
              stopOverOutbound: outboundSteps.length - 1,
              departureDate: inboundSteps[0].utc_departure,
              returnDate: outboundSteps[outboundSteps.length - 1].utc_arrival,
              arrivalLocalDate:
                inboundSteps[inboundSteps.length - 1].local_arrival,
              leavingLocalDate: outboundSteps[0].local_departure,
            },
          };
        }),
      ),
    );
  }

  const formatedDestinations = await Promise.all(promises);

  return formatedDestinations.flat();
};

/**
 * Valid accomodation price in destination and add price to the trip
 * @returns Returns trip with accomodation price or [] if budget not correspond.
 */
export const validAccomodationBudgetAndFormatTrip = (
  trip,
  correspondingCity,
  travelersNumber,
  nightsNumber,
  budgetMax,
) => {
  let formatedTrip = [];

  // Accomodation price percentage depending on the percentage of price used by transport
  const accomodationPricePecentage =
    tripBudgetPercentage.transportation -
    trip.Transportation.price / budgetMax +
    tripBudgetPercentage.accomodation;

  const accomodationTotalBudgetMax = budgetMax * accomodationPricePecentage;

  const accomodationMinPricePerNight =
    (travelersNumber === 1
      ? correspondingCity.soloPricePerPersonMin
      : correspondingCity.multiplePricePerPersonMin) * travelersNumber;
  const accomodationMaxPricePerNight =
    (travelersNumber === 1
      ? correspondingCity.soloPricePerPersonMax
      : correspondingCity.multiplePricePerPersonMax) * travelersNumber;

  if (
    accomodationTotalBudgetMax >
    accomodationMinPricePerNight * nightsNumber
  ) {
    const averagePricePerNight = Math.round(
      (accomodationMinPricePerNight * 3 +
        Math.min(
          accomodationMaxPricePerNight,
          accomodationTotalBudgetMax / nightsNumber,
        )) /
        4,
    );

    formatedTrip = [
      {
        ...trip,
        destinationPicture: correspondingCity.cityPic,
        popularity: correspondingCity.kiwiDstPopularityScore,
        Accomodation: { averagePricePerNight },
      },
    ];
  }

  return formatedTrip;
};

export const addOtherBudgetAndFormatTrip = (trip) => {
  const accomodationAndTransportPrice =
    trip.Transportation.price +
    trip.Accomodation.averagePricePerNight * trip.nightsNumber;

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
    ...trip,
    otherSpentPrice: maxOtherBudget,
    totalPrice: accomodationAndTransportPrice + maxOtherBudget,
  };
};
