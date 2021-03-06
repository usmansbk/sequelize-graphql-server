import { gql } from "apollo-server-express";
import createApolloTestServer from "tests/mocks/apolloServer";
import FactoryBot from "tests/factories";
import storage from "~utils/storage";

storage.remove = jest.fn().mockReturnValueOnce(Promise.resolve());

const query = gql`
  mutation RemoveProfilePicture {
    removeCurrentUserAvatar {
      code
      message
      success
      user {
        avatar {
          url
        }
      }
    }
  }
`;

describe("Mutation.removeCurrentUserAvatar", () => {
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

  test("should remove user avatar", async () => {
    const user = await FactoryBot.create("user");
    await user.createAvatar(FactoryBot.attributesFor("file"));

    const res = await server.executeOperation(
      {
        query,
      },
      { currentUser: user }
    );
    expect(storage.remove).toBeCalled();
    expect(res.data.removeCurrentUserAvatar).toEqual({
      code: "Success",
      message: "Success",
      success: true,
      user: {
        avatar: null,
      },
    });
  });

  test("should not allow unauthenticated access", async () => {
    const { errors } = await server.executeOperation({
      query,
    });
    expect(errors[0].message).toMatch("Unauthenticated");
  });
});
