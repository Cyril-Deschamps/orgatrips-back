// Load required packages
import { secret } from "../config/config.js";
import uid from "uid-safe";
import jwt from "jsonwebtoken"; // used to create, sign, and verify tokens
import loggerFactory from "../log";
import Cookies from "cookies";
import { models } from "../models";
// Load custom Service
import {
  PUBLIC_ATTRIBUTES,
  REGISTER_REQUIRED_FIELDS,
  UPDATABLE_FIELDS,
} from "../models/user.model";
import { hashPassword, verifyPassword } from "../services/pwdService.js";
import { AppError } from "../services/errorService.js";

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
        verifyPassword(req.body.password, user.password, (err, isMatch) => {
          if (err) {
            return res.status(500).send(err);
          }
          // Password did not match
          if (!isMatch) {
            logger.debug("Authentication failed. Wrong password");
            return res
              .status(404)
              .send("Authentication failed. User not found.");
          }
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
          // copy user to sign a light user without KYC
          const cookieUser = { ...user };
          const token = jwt.sign(cookieUser, secret, {
            expiresIn: validity, //=1week //6000000 //'2 days' // expires in 2 days
          });
          logger.debug(
            "Email Authentication success. Token generated :" + token,
          );
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

export const isAuthenticated = function (req, _res, next) {
  // check header or url parameters or post parameters for token
  //var token = req.body.token || req.query.token || req.headers['x-access-token'];
  let xsrfToken;
  if (req.headers.authorization) {
    xsrfToken = req.headers.authorization.substr(7);
  } else if (req.params.xsrfToken) {
    xsrfToken = req.params.xsrfToken;
  } else {
    throw new AppError("No Authorization header", 401);
  }
  logger.debug("x-xsrf-token", xsrfToken);
  //look inside cookie jar for token
  const token = new Cookies(req).get("access_token");
  logger.debug("cookie token", token);

  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        logger.debug("Failed to authenticate token");
        throw new AppError("Failed to authenticate token.", 401);
      }
      // looks good check for XSRF attacks, xsrf token must match cookie
      if (decoded.xsrfToken !== xsrfToken) {
        throw new AppError("Hacking XSRF Attempt", 401);
      }
      // if everything is good, save to request for use in other routes
      logger.debug("%o", decoded);
      req.decoded = decoded;
      models.User.findByPk(req.decoded.id, { rejectOnEmpty: true }).then(
        (user) => {
          req.user = user;
          if (next) {
            next();
          } else {
            return;
          }
        },
        () => {
          throw new AppError("No user matching", 401);
        },
      );
    });
  } else {
    // if there is no token
    // return an error
    throw new AppError("No token provided", 401);
  }
};

// Required isAuthenticated middleware before
export const isAdmin = function (req, res, next) {
  if (req.user.admin) {
    return next();
  }
  res.sendStatus(401);
};

export const tryIsAuthenticated = function (req, res, next) {
  try {
    isAuthenticated(req, res, next);
  } catch (_e) {
    next();
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

export const createUser = async function (req, res, next) {
  logger.debug("Start createUser");

  const userObjectIsComplete = REGISTER_REQUIRED_FIELDS.every(
    (field) => req.body[field] !== undefined && req.body[field] !== null,
  );

  if (!req.body || !userObjectIsComplete) {
    return res.status(400).send("user object is not present or incomplete");
  }

  const password = req.body.password;

  // we hash the password to be the stored in the database
  await hashPassword(req.body.password)
    .then(
      async (encryptedPwd) => {
        req.body.password = encryptedPwd;
        await models.User.create(req.body);
      },
      () => res.status(500).send("Password could'nt be encrypted"),
    )
    .then(
      () => {
        req.body.password = password;
        next();
      },
      () => res.sendStatus(409),
    );
};
