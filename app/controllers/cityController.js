import { models } from "../models";
import { join } from "path";
import { cityPicMediaPath } from "../config/config";

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
