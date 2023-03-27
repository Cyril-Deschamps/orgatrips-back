import express from "express";
import { findAirports } from "../controllers/airportController";

const airportsRouter = express.Router();

airportsRouter.route("/").get(findAirports);

export default airportsRouter;
