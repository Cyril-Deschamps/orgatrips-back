import axios from "axios";
import { program } from "commander";
import sequelize, { models } from "../app/models";
import inquirer from "inquirer";
import loggerFactory from "../app/log";
const logger = loggerFactory(import.meta.url);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCities() {
  const cities = await models.City.findAll();
  return cities;
}

async function fetchPexelsImage(city) {
  try {
    const apiKey = "B6zFEj0BGaNz0RGw5J6RHfkeTSF1ljpCfjsIzMQ4nJRBu4UqiGEuna5O";
    const response = await axios.get(
      `https://api.pexels.com/v1/search?query=${city.name}+ville&orientation=landscape&locale=fr-FR`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    if (response.data.photos.length > 0) {
      const imageUrl = response.data.photos[0].src.landscape;
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const contentType = imageResponse.headers["content-type"];
      const base64Image = `data:${contentType};base64,${Buffer.from(
        imageResponse.data,
        "binary",
      ).toString("base64")}`;

      await city.update({ cityPic: base64Image });
      logger.info(`Image saved for ${city.name}`);

      await sleep(19000);
    } else {
      logger.error(`No image found for ${city.name}`);
    }
  } catch (e) {
    logger.error(`No image found for ${city.name} - ${e}`);
  }
}

program.command("insert").action(async () => {
  await sequelize.authenticate();

  const command = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Do you want to insert cities images ?",
    },
  ]);

  if (command.confirm) {
    const cities = await fetchCities();
    for (const city of cities) {
      await fetchPexelsImage(city);
    }
  }

  await sequelize.close();
});

program.parse();
