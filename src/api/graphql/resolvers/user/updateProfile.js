import QueryError from "~utils/errors/QueryError";
import { PROFILE_UPDATED } from "~constants/i18n";
import { Fail, Success } from "~helpers/response";

export default {
  Mutation: {
    async updateProfile(_parent, { input }, { dataSources, t }) {
      try {
        const user = await dataSources.users.updateCurrentUser(input);

        return Success({
          code: PROFILE_UPDATED,
          message: t(PROFILE_UPDATED),
          user,
        });
      } catch (e) {
        if (e instanceof QueryError) {
          return Fail({
            message: t(e.message),
            code: e.code,
            errors: e.errors,
          });
        }
        throw e;
      }
    },
  },
};