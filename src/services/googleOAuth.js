import { OAuth2Client } from "google-auth-library";
import TokenError from "~utils/errors/TokenError";
import { TOKEN_INVALID_ERROR } from "~helpers/constants/i18n";

const verifyGoogleToken = async (idToken) => {
  const client = new OAuth2Client();
  try {
    const ticket = await client.verifyIdToken({
      idToken,
    });

    const payload = ticket.getPayload();

    return {
      firstName: payload.given_name,
      lastName: payload.given_name,
      email: payload.email,
      emailVerified: payload.email_verified,
      socialAvatarURL: payload.picture,
      language: payload.locale,
    };
  } catch (e) {
    throw new TokenError(TOKEN_INVALID_ERROR);
  }
};

export default verifyGoogleToken;