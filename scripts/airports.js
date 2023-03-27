import { program } from "commander";
import sequelize, { models } from "../app/models";
import inquirer from "inquirer";
import { readFile } from "fs/promises";
import loggerFactory from "../app/log";
const logger = loggerFactory(import.meta.url);

program.command("insert").action(async () => {
  await sequelize.authenticate();

  const command = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Do you want to insert airports ?",
    },
  ]);

  if (command.confirm) {
    const airports = JSON.parse(
      await readFile(
        new URL("../storage/airports.json", import.meta.url),
        "utf-8",
      ),
    );

    try {
      await models.Airport.bulkCreate(airports);
      logger.debug(`Succès`);
    } catch (e) {
      logger.error(`Error :`, e);
    }
  }

  await sequelize.close();
});

program.parse();
