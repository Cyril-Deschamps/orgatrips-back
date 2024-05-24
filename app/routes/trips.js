import express from "express";
import {
  getFeedTrips,
  searchTrips,
  handleLiveFeedMessage,
  saveTrip,
  unsaveTrip,
  getOwnTrips,
} from "../controllers/tripController";
import {
  isAuthenticated,
  tryIsAuthenticated,
} from "../controllers/userController";

const tripsRouter = () => {
  const tripsRouter = express.Router();

  tripsRouter
    .route("/")
    .get(isAuthenticated, getOwnTrips)
    .post(isAuthenticated, saveTrip);

  tripsRouter.route("/:tripId").delete(isAuthenticated, unsaveTrip);

  tripsRouter.route("/search").post(searchTrips);

  tripsRouter.route("/feed").get(tryIsAuthenticated, getFeedTrips);

  tripsRouter.use("/liveFeed/:xsrfToken", isAuthenticated);
  tripsRouter.ws("/liveFeed/:xsrfToken", (ws, req) => {
    ws.on("message", (data) => handleLiveFeedMessage(req.user, ws, data));
  });

  return tripsRouter;
};

export default tripsRouter;
