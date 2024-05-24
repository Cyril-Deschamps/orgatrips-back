import express from "express";
import { findAirports } from "../controllers/airportController";

const airportsRouter = () => {
  const airportsRouter = express.Router();

  airportsRouter.route("/").get(findAirports);

  return airportsRouter;
};
export default airportsRouter;
