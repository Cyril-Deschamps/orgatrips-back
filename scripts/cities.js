import { program } from "commander";
import sequelize, { models } from "../app/models";
import inquirer from "inquirer";
import { readFile } from "fs/promises";
import loggerFactory from "../app/log";
import { getCityAverageRangeAccomodationsPrice } from "../app/services/accomodationFetchPriceService";
import { addMonths, addDays } from "date-fns";
const logger = loggerFactory(import.meta.url);

program.command("insert").action(async () => {
  await sequelize.authenticate();

  const command = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Do you want to insert cities ?",
    },
  ]);

  if (command.confirm) {
    let cities = JSON.parse(
      await readFile(new URL("../storage/cities.json", import.meta.url)),
    );

    const dbCities = await models.City.findAll();
    cities = cities.filter(
      (city) => !dbCities.find((dbCity) => dbCity.name === city.name),
    );

    const dateInThreeMonths = addMonths(new Date(), 3);
    const dateInThreeMonthsAndThreeDays = addDays(addMonths(new Date(), 3), 3);

    const promisesList = cities.map((city) => async () => {
      const [soloPricePerPerson, multiplePricePerPerson] = await Promise.all([
        getCityAverageRangeAccomodationsPrice({
          adultsNumber: 1,
          city: city.name,
          startDate: dateInThreeMonths,
          endDate: dateInThreeMonthsAndThreeDays,
        }).then((ranges) => ranges.soloPricePerPersonRange),
        getCityAverageRangeAccomodationsPrice({
          adultsNumber: 2,
          city: city.name,
          startDate: dateInThreeMonths,
          endDate: dateInThreeMonthsAndThreeDays,
        }).then((ranges) => ranges.multiplePricePerPersonRange),
      ]);

      return Promise.resolve({
        ...city,
        soloPricePerPerson,
        multiplePricePerPerson,
      });
    });

    for (const [i, promise] of promisesList.entries()) {
      try {
        const city = await promise();
        logger.info("Scrap success for : " + city.name);
        await models.City.create({
          slug: city.id,
          name: city.name,
          countryCode: city.country,
          code: city.code,
          kiwi_dst_popularity_score: city.dst_popularity_score,
          lat: city.lat,
          lon: city.lon,
          soloPricePerPersonMin: city.soloPricePerPerson[0],
          soloPricePerPersonMax: city.soloPricePerPerson[1],
          multiplePricePerPersonMin: city.multiplePricePerPerson[0],
          multiplePricePerPersonMax: city.multiplePricePerPerson[1],
        })
          .then(() => logger.debug(`Ville insérée : ${city.name}`))
          .catch((error) => logger.error(error));
      } catch (e) {
        logger.error(`Error on ${cities[i]} :`, e);
      }
    }
  }

  await sequelize.close();
});

program.parse();
