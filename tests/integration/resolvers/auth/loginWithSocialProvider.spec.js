import { gql } from "apollo-server-express";
import createApolloTestServer from "tests/mocks/apolloServer";
import FactoryBot from "tests/factories";
import jwt from "~utils/jwt";
import TokenError from "~utils/errors/TokenError";
import { TOKEN_INVALID_ERROR } from "~helpers/constants/responseCodes";

jwt.verifySocialToken = jest.fn();

const query = gql`
  mutation LoginWithSocialProvider($input: SocialLoginInput!) {
    loginWithSocialProvider(input: $input) {
      success
      code
      message
      accessToken
      refreshToken
    }
  }
`;

describe("Mutation.loginWithSocialProvider", () => {
  let server;
  beforeAll(() => {
    server = createApolloTestServer();
  });

  afterAll((done) => {
    server.stop().then(done);
  });

  beforeEach(async () => {
    await FactoryBot.truncate();
  });

  test("should register a new user if they don't exist", async () => {
    const { firstName, lastName, email } = FactoryBot.attributesFor("user");
    jwt.verifySocialToken.mockReturnValue({
      firstName,
      lastName,
      email,
    });
    const {
      data: { loginWithSocialProvider },
    } = await server.executeOperation({
      query,
      variables: {
        input: { token: "faketoken", provider: "GOOGLE" },
      },
    });
    expect(loginWithSocialProvider.message).toMatch("WelcomeNewUser");
    expect(loginWithSocialProvider.accessToken).toBeDefined();
    expect(loginWithSocialProvider.refreshToken).toBeDefined();
  });

  test("should login an already existing user", async () => {
    const fields = FactoryBot.attributesFor("user");
    await FactoryBot.create("user", fields);
    jwt.verifySocialToken.mockReturnValue({
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
    });
    const {
      data: { loginWithSocialProvider },
    } = await server.executeOperation({
      query,
      variables: {
        input: { token: "faketoken", provider: "GOOGLE" },
      },
    });
    expect(loginWithSocialProvider.message).toMatch("WelcomeBack");
    expect(loginWithSocialProvider.accessToken).toBeDefined();
    expect(loginWithSocialProvider.refreshToken).toBeDefined();
  });

  test("should throw an error for invalid token", async () => {
    jwt.verifySocialToken.mockImplementation(() => {
      throw new TokenError(TOKEN_INVALID_ERROR);
    });
    const { errors } = await server.executeOperation({
      query,
      variables: {
        input: { token: "invalid", provider: "GOOGLE" },
      },
    });
    expect(errors[0].message).toMatch("TokenInvalidError");
  });
});
