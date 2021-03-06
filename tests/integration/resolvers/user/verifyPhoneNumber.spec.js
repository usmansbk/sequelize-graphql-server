import { gql } from "apollo-server-express";
import createApolloTestServer from "tests/mocks/apolloServer";
import FactoryBot from "tests/factories";
import cache from "~utils/cache";
import { PHONE_NUMBER_KEY_PREFIX } from "~helpers/constants/auth";

const query = gql`
  mutation VerifyPhoneNumber($token: String!) {
    verifyPhoneNumber(token: $token) {
      code
      message
      success
      user {
        id
        phoneNumberVerified
      }
    }
  }
`;

describe("Mutation.verifyPhoneNumber", () => {
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

  test("should verify phone number", async () => {
    const currentUser = await FactoryBot.create("user");

    const token = "mockToken";
    const key = `${PHONE_NUMBER_KEY_PREFIX}:${currentUser.id}`;
    await cache.set(key, token, "1 minute");

    const res = await server.executeOperation(
      {
        query,
        variables: {
          token,
        },
      },
      { currentUser }
    );

    expect(res.data.verifyPhoneNumber).toEqual({
      code: "PhoneNumberVerified",
      message: "PhoneNumberVerified",
      success: true,
      user: {
        id: currentUser.id,
        phoneNumberVerified: true,
      },
    });
  });

  test("should not use invalid otp", async () => {
    const currentUser = await FactoryBot.create("user");

    const res = await server.executeOperation(
      {
        query,
        variables: {
          token: "mockToken",
        },
      },
      { currentUser }
    );

    expect(res.data.verifyPhoneNumber).toEqual({
      code: "InvalidOtp",
      message: "InvalidOtp",
      success: false,
      user: null,
    });
  });

  test("should not allow unauthenticated access", async () => {
    const { errors } = await server.executeOperation({
      query,
      variables: {
        token: "invalid",
      },
    });
    expect(errors[0].message).toMatch("Unauthenticated");
  });
});
