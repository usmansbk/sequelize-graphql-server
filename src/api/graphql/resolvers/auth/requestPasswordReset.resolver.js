import links from "~helpers/links";
import { Success, Fail } from "~helpers/response";
import emailTemplates from "~helpers/emailTemplates";
import { SENT_RESET_PASSWORD_EMAIL } from "~helpers/constants/responseCodes";
import {
  PASSWORD_KEY_PREFIX,
  RESET_PASSWORD_TOKEN_EXPIRES_IN,
} from "~helpers/constants/auth";
import { ACCOUNT_STATUS } from "~helpers/constants/models";
import QueryError from "~utils/errors/QueryError";

export default {
  Mutation: {
    async requestPasswordReset(
      _parent,
      { email },
      { dataSources, locale, cache, t, jwt, mailer, clients }
    ) {
      try {
        const user = await dataSources.users.findOne({
          where: {
            email,
          },
        });

        if (user) {
          const { firstName, id, status } = user;

          if ([ACCOUNT_STATUS.BLOCKED].includes(status)) {
            throw new QueryError(status);
          }
          const key = `${PASSWORD_KEY_PREFIX}:${id}`;
          const sentToken = await cache.exists(key);

          if (!sentToken) {
            const { token, exp } = jwt.generateToken(
              {
                sub: id,
                aud: clients,
              },
              RESET_PASSWORD_TOKEN_EXPIRES_IN
            );

            await cache.set(key, token, exp);

            mailer.sendEmail({
              template: emailTemplates.RESET_PASSWORD,
              message: {
                to: email,
              },
              locals: {
                locale: user.locale || locale,
                name: firstName,
                link: links.resetPassword(token),
              },
            });
          }
        }

        return Success({
          message: t(SENT_RESET_PASSWORD_EMAIL, { email }),
          code: SENT_RESET_PASSWORD_EMAIL,
        });
      } catch (e) {
        if (e instanceof QueryError) {
          return Fail({
            message: t(e.message),
            errors: e.errors,
          });
        }

        throw e;
      }
    },
  },
};
