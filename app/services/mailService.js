import loggerFactory from "../log";
const logger = loggerFactory(import.meta.url); // use default logger set up in log.js
import { front, mail, project_name } from "../config/config.js";
import nodeMailjet from "node-mailjet";

const mailjet = nodeMailjet.connect(
  mail.mailjet_apikey_public,
  mail.mailjet_apikey_private,
);

const senderMail = mail.senderMail;

const sendMailjet = function (mailTo, subject, message, html, done) {
  mailjet
    .post("send", { version: "v3.1" })
    .request({
      Messages: [
        {
          From: {
            Email: mail.senderMail,
            Name: `${project_name} No-Reply`,
          },
          To: [
            {
              Email: mailTo,
            },
          ],
          Bcc: [
            {
              Email: mail.bcc,
            },
          ],
          Subject: subject,
          HTMLPart: html,
        },
      ],
    })
    .then(
      (result) => {
        if (done) {
          done(null, result.body);
        }
      },
      (err) => {
        if (err.response) {
          logger.error(err.response.text);
        }
        if (done) {
          done(err);
        }
      },
    );
};

// eslint-disable-next-line no-unused-vars
const sendTemplateMailjet = function (mailTo, templateId, varObj, done) {
  if (mail.templating) {
    mailjet
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: mail.senderMail,
              Name: `${project_name} No-Reply`,
            },
            To: [
              {
                Email: mailTo,
              },
            ],
            Bcc: [
              {
                Email: mail.bcc,
              },
            ],
            TemplateID: templateId,
            TemplateLanguage: true,
            Variables: varObj,
          },
        ],
      })
      .then(
        (result) => {
          if (done) {
            done(null, result.body);
          }
        },
        (err) => {
          if (err.response) {
            logger.error(err.response.text);
          }
          if (done) {
            done(err);
          }
        },
      );
  } else {
    const content = `Template id ${templateId}\n\n${JSON.stringify(
      varObj,
      null,
      4,
    )}`;
    sendMailjet(
      mailTo,
      `New mail from ${project_name}`,
      content,
      content,
      done,
    );
  }
};

export const sendUserActivationMail = function (mailTo, guid, done) {
  let message = `Bienvenue sur ${project_name} !<br><br>`;
  message +=
    "Vous venez de créer un compte sur notre plateforme, et vous en remercions !<br><br>";
  message +=
    "Afin d’utiliser nos services, vous devez confirmer votre adresse e-mail en cliquant sur ce lien :<br>";
  const activationUrl = `${front}/public/login?guid=${guid}`;
  message += `<a href="${activationUrl}">${activationUrl}</a><br>`;
  message +=
    "Si ce lien apparaît non cliquable dans votre messagerie, copiez-collez le dans votre navigateur<br><br>";
  message +=
    "Vous serez automatiquement redirigé sur notre application, aucune action supplémentaire n’est requise, mais vous devrez ensuite vous connecter pour accéder à votre espace utilisateur.<br><br>";

  message += "À très bientôt sur notre plateforme !<br><br>";

  message += `L’équipe ${project_name}`;

  sendMailjet(
    mailTo,
    `Bienvenue sur ${project_name} !`,
    message,
    message,
    done,
  );
};

export const sendMailContact = function (
  mailFrom,
  name,
  subject,
  message,
  done,
) {
  const body =
    "Contact From: " + name + " -> " + mailFrom + "<br><br>" + message;
  sendMailjet(senderMail, "Contact from Website: " + subject, body, body, done);
};

export function validateEmail(email) {
  return /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i.test(
    email,
  );
}
