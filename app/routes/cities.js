import express from "express";
import { searchTrips, accessCityPic } from "../controllers/cityController";
import { downloadFile } from "../services/fileService";

const citiesRouter = express.Router();

citiesRouter.route("/searchTrips").post(searchTrips);

citiesRouter.route("/:city_id/city-pic").get(accessCityPic, downloadFile);

export default citiesRouter;
