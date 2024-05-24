import express from "express";
import { accessCityPic } from "../controllers/cityController";
import { downloadFile } from "../services/fileService";

const citiesRouter = () => {
  const citiesRouter = express.Router();

  citiesRouter.route("/:city_id/city-pic").get(accessCityPic, downloadFile);

  return citiesRouter;
};
export default citiesRouter;
