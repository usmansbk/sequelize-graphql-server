import QueryError from "~utils/errors/QueryError";
import { PROFILE_UPDATED } from "~helpers/constants/i18n";
import { BadRequest, Ok } from "~helpers/response";

export default {
  Mutation: {
    async updateProfile(_, { input }, { dataSources, t }) {
      try {
        const user = await dataSources.users.updateCurrentUserProfile(input);

        return Ok({
          message: t(PROFILE_UPDATED),
          user,
        });
      } catch (e) {
        if (e instanceof QueryError) {
          return BadRequest({
            message: t(e.message),
            errors: e.cause?.errors,
          });
        }
        throw e;
      }
    },
  },
};