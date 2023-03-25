import express from "express";
import { searchTrips } from "../controllers/cityController";

const citiesRouter = express.Router();

citiesRouter.route("/searchTrips").post(searchTrips);

export default citiesRouter;
