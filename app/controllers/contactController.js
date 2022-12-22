import { validateEmail, sendMailContact } from "../services/mailService.js";
import loggerFactory from "../log";
const logger = loggerFactory(import.meta.url);

export const contact = function (req, res) {
  logger.debug("contactController - contact - start");
  const mailFrom = req.body.email;
  const name = req.body.name;
  const message = req.body.message;
  const subject = req.body.subject;
  const fromApp = req.body.fromApp;

  if (fromApp) {
    if (validateEmail(mailFrom)) {
      logger.debug("mailFrom: " + mailFrom);
      sendMailContact(mailFrom, name, subject, message, (err) => {
        if (err) {
          logger.error(err);
          res.status(500).send(err);
        } else {
          logger.debug("mail sent with success");
          res.sendStatus(200);
        }
      });
    } else {
      res.status(400).send("Email non valide");
    }
  } else {
    logger.error("contact not called from hybrid app");
    res.status(500).send("contact not called from hybrid app");
  }
  logger.debug("contactController - contact - end");
  return res;
};
