import { program } from "commander";
import sequelize, { models } from "../app/models";
import inquirer from "inquirer";

program.command("create").action(async () => {
  await sequelize.authenticate();

  const user = await inquirer.prompt([
    {
      name: "firstname",
      message: "Oh Nah Nah What's your FIRST name ?",
      type: "input",
    },
    {
      name: "lastname",
      message: "Oh Nah Nah What's your LAST name ?",
      type: "input",
    },
    {
      name: "email",
      message: "What's your e-mail ?",
      type: "input",
    },
    {
      type: "confirm",
      name: "confirm",
      message: "Do you want to create user with above informations ?",
    },
  ]);

  if (user.confirm) {
    await models.User.create(user);
  }

  await sequelize.close();
});

program.command("delete").action(async () => {
  await sequelize.authenticate();

  const users = await models.User.findAll();

  const { toDelete } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "toDelete",
      message: "Select users to delete",
      choices: users.map((u) => ({
        name: `${u.firstname} ${u.lastname}`,
        value: u,
      })),
    },
  ]);

  if (toDelete.length) {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete ${toDelete
          .map((u) => `${u.firstname} ${u.lastname}`)
          .join(",")} ?`,
      },
    ]);

    if (confirm) {
      await models.User.destroy({
        where: {
          id: toDelete.map((u) => u.id),
        },
      });
    }
  }

  await sequelize.close();
});

program.parse();
