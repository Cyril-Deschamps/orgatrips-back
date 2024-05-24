import loggerFactory from "../log";
const logger = loggerFactory(import.meta.url);
import { genSalt, hash, compare } from "bcrypt";

export const hashPassword = function (clearPwd, done) {
  logger.debug("userService - Start hashPassword");

  if (done) {
    genSalt(10, (err, salt) => {
      if (err) return done(err);
      hash(clearPwd, salt, (err, hash) => {
        if (err) return done(err);
        done(null, hash);
      });
    });
  } else {
    return genSalt().then((salt) => hash(clearPwd, salt));
  }
};

export const verifyPassword = function (password, userPassword, cb) {
  compare(password, userPassword, (err, isMatch) => {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};
