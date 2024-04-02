// Load required packages
import { secret, userProfilePicMediaPath } from "../config/config.js";
import uid from "uid-safe";
import jwt from "jsonwebtoken"; // used to create, sign, and verify tokens
import loggerFactory from "../log";
import Cookies from "cookies";
import { models } from "../models";
import { join } from "path";
// Load custom Service
import { PUBLIC_ATTRIBUTES, UPDATABLE_FIELDS } from "../models/user.model";

const logger = loggerFactory(import.meta.url);

export const authenticate = function (req, res) {
  logger.debug("try to login user :", req.body.email);
  models.User.findOne({
    where: {
      email: req.body.email,
    },
  }).then(
    (user) => {
      if (!user) {
        logger.debug("Authentication failed. User not found");
        res.status(404).send("Authentication failed. User not found.");
      } else if (user) {
        user = user.get({
          plain: true,
        });
        logger.debug("%O", user);
        // Success if user is found and password is right create a token
        // we remove password from the payload
        delete user.password;
        // we add csrf-token
        user.xsrfToken = uid.sync(18);
        const hour = 3600;
        const validity = 7 * 24 * hour;
        const token = jwt.sign(user, secret, {
          expiresIn: validity, //=1week //6000000 //'2 days' // expires in 2 days
        });
        logger.debug("Email Authentication success. Token generated :" + token);
        new Cookies(req, res).set("access_token", token, {
          httpOnly: true, //cookie not available through client js code
          secure: false, // true to force https
          maxAge: validity * 1000, // 1 week
        });

        // return the information including token as JSON
        res.status(200).send({
          success: true,
          message: "Enjoy your token!",
          user,
        });
      }
    },
    (error) => {
      logger.error("%O", error);
      res.sendStatus(500);
    },
  );
};

export const hasCookies = function (req, res) {
  //check if Cookie is transmitted with request
  logger.debug("Health Checking, start hasCookies");
  const token = new Cookies(req, res).get("access_token");
  if (token) {
    logger.debug("cookie provided");
    res.sendStatus(200);
  } else {
    logger.error("cookie not provided");
    res.status(401).send("No token provided");
  }
};

// middleware function to check if the current ressource is accessed by the owning user
export const hasAccessToUser = async function (req, res, next) {
  if (req.decoded && req.decoded.id === parseInt(req.params.user_id, 10)) {
    logger.debug("current user is the owner");
    try {
      req.user = await models.User.findByPk(req.params.user_id);
      return next();
    } catch (e) {
      next(e);
    }
  }
  res.status(403).send("Resource is not owned by this user");
};

export const isAuthenticated = function (req, res, next) {
  // check header or url parameters or post parameters for token
  //var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (!req.headers.authorization)
    return res.status(401).send("No Authorization header");
  const xsrfToken = req.headers.authorization.substr(7); // Remove Bearer
  logger.debug("x-xsrf-token", xsrfToken);
  //look inside cookie jar for token
  const token = new Cookies(req, res).get("access_token");
  logger.debug("cookie token", token);

  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        logger.debug("Failed to authenticate token");
        return res.status(401).send("Failed to authenticate token.");
      }
      // looks good check for XSRF attacks, xsrf token must match cookie
      if (decoded.xsrfToken !== xsrfToken) {
        return res.status(401).send("Hacking XSRF Attempt");
      }
      // if everything is good, save to request for use in other routes
      logger.debug("%o", decoded);
      req.decoded = decoded;
      models.User.findByPk(req.decoded.id, { rejectOnEmpty: true }).then(
        (user) => {
          req.user = user;
          next();
        },
        () => res.status(401).send("No user matching"),
      );
    });
  } else {
    // if there is no token
    // return an error
    return res.status(401).send("No token provided");
  }
};

export const logout = function (req, res) {
  res.clearCookie("access_token");
  res.status(200).send("Cookie successfully deleted!");
};

// Create endpoint /users/:id for GET
export const getUserById = function (req, res) {
  logger.debug("getUserById :" + req.params.user_id);
  models.User.findByPk(req.params.user_id, {
    attributes: PUBLIC_ATTRIBUTES,
  }).then(
    (user) => {
      if (!user) return res.sendStatus(404);
      res.status(200).send(user);
    },
    (err) => res.status(500).send(err),
  );
};

export async function updateUser(req, res, next) {
  try {
    await req.user.update(req.body, {
      fields: UPDATABLE_FIELDS,
    });
    next();
  } catch (e) {
    logger.error(e);
    next(e);
  }
}

export async function accessUserProfilePic(req, res, next) {
  try {
    const user = await models.User.findByPk(req.params.user_id, {
      fields: ["profilePic"],
    });
    if (!user || !user.profilePic) return res.sendStatus(404);

    req.file = {
      path: join(userProfilePicMediaPath, user.getDataValue("profilePic")),
    };
    next();
  } catch (error) {
    next(error);
  }
}
