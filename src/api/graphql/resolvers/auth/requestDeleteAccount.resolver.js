import links from "~helpers/links";
import { Success } from "~helpers/response";
import emailTemplates from "~helpers/emailTemplates";
import { SENT_CONFIRM_DELETE_ACCOUNT_EMAIL } from "~helpers/constants/responseCodes";
import {
  DELETE_ACCOUNT_KEY_PREFIX,
  DELETE_ACCOUNT_TOKEN_EXPIRES_IN,
} from "~helpers/constants/auth";

export default {
  Mutation: {
    async requestDeleteAccount(
      _parent,
      _args,
      { locale, cache, t, jwt, mailer, currentUser, clients }
    ) {
      const { firstName, id, email } = currentUser;
      const key = `${DELETE_ACCOUNT_KEY_PREFIX}:${id}`;
      const sentToken = await cache.exists(key);

      if (!sentToken) {
        const { token, exp } = jwt.generateToken(
          {
            sub: id,
            aud: clients,
          },
          DELETE_ACCOUNT_TOKEN_EXPIRES_IN
        );

        await cache.set(key, token, exp);

        mailer.sendEmail({
          template: emailTemplates.CONFIRM_DELETE_ACCOUNT,
          message: {
            to: email,
          },
          locals: {
            locale,
            name: firstName,
            link: links.deleteAccount(token),
          },
        });
      }

      return Success({
        message: t(SENT_CONFIRM_DELETE_ACCOUNT_EMAIL, { email }),
        code: SENT_CONFIRM_DELETE_ACCOUNT_EMAIL,
      });
    },
  },
};
