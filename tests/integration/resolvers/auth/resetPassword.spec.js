import { gql } from "apollo-server-express";
import db from "~db/models";
import createApolloTestServer from "tests/integration/apolloServer";
import attributes from "tests/attributes";
import store from "~utils/store";
import jwt from "~utils/jwt";
import { PASSWORD_KEY_PREFIX } from "~constants/auth";
import dayjs from "dayjs";
import auth from "tests/support/auth";

const query = gql`
  mutation ResetPassword($input: PasswordResetInput!) {
    resetPassword(input: $input) {
      code
      message
      success
    }
  }
`;

describe("Mutation.resetPassword", () => {
  let server;
  let user;
  let token;
  beforeAll(async () => {
    server = createApolloTestServer();
    user = await db.User.create(attributes.user());
    const result = jwt.generateToken({
      sub: user.id,
      aud: process.env.TEST_CLIENT_ID,
    });
    token = result.token;
    await store.set({
      key: `${PASSWORD_KEY_PREFIX}:${user.id}`,
      value: result.token,
      expiresIn: dayjs.duration(1, "minutes").asMilliseconds(),
    });
  });

  afterAll(async () => {
    await server.stop();
    await db.sequelize.close();
  });

  test("should update password and logout", async () => {
    const authPayload = await auth.login(user);
    const password = "password1";
    const res = await server.executeOperation({
      query,
      variables: {
        input: {
          token,
          password,
        },
      },
    });
    await user.reload();
    const changed = await user.checkPassword(password);
    const sid = await store.get(`${authPayload.clientId}:${user.id}`);

    expect(res.data.resetPassword).toEqual({
      code: "PasswordChanged",
      message: "PasswordChanged",
      success: true,
    });
    expect(changed).toBe(true);
    expect(sid).toBe(null);
  });

  test("should use reset token once", async () => {
    const newPassword = "password";
    const res = await server.executeOperation({
      query,
      variables: {
        input: {
          token,
          password: newPassword,
        },
      },
    });
    await user.reload();
    const changed = await user.checkPassword(newPassword);
    expect(res.data.resetPassword).toEqual({
      code: "InvalidLink",
      message: "InvalidLink",
      success: false,
    });
    expect(changed).toBe(false);
  });
});
