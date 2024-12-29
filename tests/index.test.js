const axios2 = require("axios");
const {WebSocket} = require("ws");
const BACKEND_URL = "http://localhost:3000";
const WS_URL = "ws://localhost:8080";

const axios = {
  post: async (...args) => {
    try {
      const res = await axios2.post(...args);

      return res;
    } catch (e) {
      return e.response;
    }
  },
  get: async (...args) => {
    try {
      const res = await axios2.get(...args);
      return res;
    } catch (e) {
      return e.response;
    }
  },
  put: async (...args) => {
    try {
      const res = await axios2.put(...args);
      return res;
    } catch (e) {
      return e.response;
    }
  },
  delete: async (...args) => {
    try {
      const res = await axios2.delete(...args);
      return res;
    } catch (e) {
      return e.response;
    }
  },
};

// test("adds 1 + 2 to equal 3", () => {
//   expect(sum(1, 2)).toBe(3);
// });

describe("Authentication", () => {
  test("sign up any user only once", async () => {
    const username = "gdas" + Math.random();

    const password = "123456";

    const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    expect(response.status).toBe(200);

    const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    expect(updatedResponse.status).toBe(400);
  });

  test("signup fails if username is empty", async () => {
    const username = "gdas" + Math.random();
    const password = "123456";
    const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      password,
      type: "admin",
    });

    expect(response.status).toBe(400);
  });

  test("signIn if both the password and username are correct", async () => {
    const username = "gdas" + Math.random();
    const password = "123456";
    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    console.log("response " + response.data.token);
    expect(response.data.token).toBeDefined();
  });
  test("signIn failed if both username and password are incorrect", async () => {
    const username = "gdas" + Math.random();
    const password = "123456";

    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: "ErrorUser",
      password: "ErrorPassword",
    });

    expect(response.status).toBe(403);
  });
});

describe("User information Endpoints", () => {
  let token = "";
  let avatarId = "";

  beforeAll(async () => {
    const username = "gdas" + Math.random();
    const password = "123456";

    await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    token = response.data.token;
    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(avatarResponse.data);
    avatarId = avatarResponse.data.id;
    console.log("avatarId " + avatarId);
  });

  test("User can't update the avatar if they provide wrong avatar ID", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,

      {
        avatarId: "1231312312",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    expect(response.status).toBe(400);
  });
  test("User successfully updates avatar if avatar id is correct", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      {
        avatarId,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(token);
    console.log(response.status);
    expect(response.status).toBe(200);
  });

  test("User is not authenticated", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/user/metadata`,
      { avatarId },
      {
        headers: {
          authorization: `Bearer ABXOICHJA`,
        },
      }
    );
    console.log(response);
    expect(response.status).toBe(403);
  });
});

describe("User Avatar Information", () => {
  let avatarId = "";
  let userId = "";
  let token = "";
  beforeAll(async () => {
    const username = "gdas" + Math.random();
    const password = "123456";

    const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });
    console.log("userid is " + userId);

    userId = signupResponse.data.userId;

    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username,
      password,
    });
    token = response.data.token;
    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    avatarId = avatarResponse.data.avatarId;
  });

  test("Get other users metadata ", async () => {
    const response = await axios.get(
      `${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`
    );
    console.log("response was " + userId);
    console.log(JSON.stringify(response.data));
    expect(response.data.avatars).toBeDefined();
    expect(response.data.avatars[0].userId).toBe(userId);
  });

  test("Get all available avatars", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);
    expect(response.data.avatars).toBeDefined();
  });
});

describe("Admin Creator endpoints", () => {
  let adminToken;
  let adminId;
  let userToken;
  let userId;
  let element1Id;
  let element2Id;

  beforeAll(async () => {
    const username = `kirat-${Math.random()}`;
    const password = "123456";

    const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    adminId = signupResponse.data.userId;

    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: username,
      password,
    });

    adminToken = response.data.token;

    const userSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username: username + "-user",
        password,
        type: "user",
      }
    );

    userId = userSignupResponse.data.userId;

    const userSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username: username + "-user",
        password,
      }
    );

    userToken = userSigninResponse.data.token;
  });

  test("User is not able to hit admin Endpoints", async () => {
    const elementReponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "test space",
        defaultElements: [],
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    const updateElementResponse = await axios.put(
      `${BACKEND_URL}/api/v1/admin/element/123`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(elementReponse.status).toBe(403);
    expect(mapResponse.status).toBe(403);
    expect(avatarResponse.status).toBe(403);
    expect(updateElementResponse.status).toBe(403);
  });
  test("Admin is able to hit admin Endpoints", async () => {
    const elementReponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    const response1 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = response1.data.id;
    const response2 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element2Id = response2.data.id;
    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        name: "Space",
        dimensions: "100x200",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 21,
          },
          {
            elementId: element2Id,
            x: 10,
            y: 12,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    console.log(response1.data);
    console.log(response2.data);
    console.log(mapResponse.data);

    const avatarResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/avatar`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        name: "Timmy",
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    expect(elementReponse.status).toBe(200);
    expect(mapResponse.status).toBe(200);
    expect(avatarResponse.status).toBe(200);
  });

  test("Admin is able to update the imageUrl for an element", async () => {
    const elementResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        "width": 1,
        "height": 1,
      "static": true                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const updateElementResponse = await axios.put(
      `${BACKEND_URL}/api/v1/admin/element/${elementResponse.data.id}`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    expect(updateElementResponse.status).toBe(200);
  });
});

describe("Space Dashboard Information", () => {
  let mapId;

  let element1Id;
  let element2Id;
  let adminToken;
  let adminId;
  let userToken;
  let userId;
  beforeAll(async () => {
    const username = "gdas" + Math.random();
    const password = "123456";
    const userSignUpResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username: username + "-user",
        password,
        type: "user",
      }
    );
    userId = userSignUpResponse.data.userId;
    const userResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: username + "-user",
      password,
    });
    //console.log("userResponse " + userResponse.data.token)
    userToken = userResponse.data.token;

    const username1 = "admin" + Math.random();
    const password1 = "123456";
    const adminSignUpResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username: username1,
        password: password1,
        type: "admin",
      }
    );

    adminId = adminSignUpResponse.data.userId;

    const adminResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: username1,
      password: password1,
    });
    console.log("adminSignUpResponse " + adminSignUpResponse.data.userId);
    adminToken = adminResponse.data.token;
    console.log("adminResponse " + adminToken);
    //Setting up mapId;
    const response1 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = response1.data.id;
    const response2 = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element2Id = response2.data.id;

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "100 person interview room",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 21,
          },
          {
            elementId: element2Id,
            x: 10,
            y: 12,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;
    console.log("mapResponse" + mapResponse.data.id);
  });

  test("Create a new space", async () => {
    console.log("mapId " + mapId);
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.data.spaceId).toBeDefined();
    expect(response.status).toBe(200);
   
  });

  test("Creates a spcae if mapId is not provided", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    // console.log(response.data)
    expect(response.status).toBeDefined();
  });

  test("User is not able to create a space without mapId and dimensions", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(response.status).toBe(400);
  });

  test("User is not able to delete a space that doesnt exist", async () => {
    const response = await axios.delete(
      `${BACKEND_URL}/api/v1/space/randomIdDoesntExist`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(response.status).toBe(400);
  });

  test("Delete an existing space", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    const spaceId = response.data.spaceId;
    const deletedResponse = await axios.delete(
      `${BACKEND_URL}/api/v1/space/${spaceId}`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(deletedResponse.status).toBe(200);
  });

  test("Delete fails if wrong spaceId is provided", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    const spaceId = response.data.spaceId;
    const deletedResponse = await axios.delete(
      `${BACKEND_URL}/api/v1/space/AXKPLSPERROR`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(deletedResponse.status).toBe(400);
  });

  test("Get all existing space", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    expect(response.data.spaces).toBeDefined();
  }),
    test("User should not be able to delete a space created by another user", async () => {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/space`,
        {
          name: "Test",
          dimensions: "100x200",
        },
        {
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        }
      );
      console.log("space response " + response.data.spaceId);

      const deleteReponse = await axios.delete(
        `${BACKEND_URL}/api/v1/space/${response.data.spaceId}`,
        {
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        }
      );

      expect(deleteReponse.status).toBe(403);
    });

  test("Admin has no spaces initially", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    expect(response.data.spaces.length).toBe(0);
  });

  test("Admin has gets once space after", async () => {
    const spaceCreateReponse = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    console.log("jhflksdjflksdfjlksdfj");
    console.log(spaceCreateReponse.data);
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });
    const filteredSpace = response.data.spaces.find(
      (x) => x.id == spaceCreateReponse.data.spaceId
    );
    expect(response.data.spaces.length).toBe(1);
    expect(filteredSpace).toBeDefined();
  });
});

describe("Arena", () => {
  let mapId;
  let element1Id;
  let element2Id;
  let adminToken;
  let adminId;
  let userToken;
  let userId;
  let spaceId;

  beforeAll(async () => {
    const username = "gdas" + Math.random();
    const password = "123456";

    const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
      username,
      password,
      type: "admin",
    });

    adminId = signupResponse.data.userId;

    const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
      username: username,
      password,
    });

    adminToken = response.data.token;

    const userSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username: username + "-user",
        password,
        type: "user",
      }
    );

    userId = userSignupResponse.data.userId;

    const userSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username: username + "-user",
        password,
      }
    );

    userToken = userSigninResponse.data.token;
    console.log("UserToken " + userToken);

    const element1Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const element2Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Response.data.id;
    element2Id = element2Response.data.id;

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "Default space",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;
    const spaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    spaceId = spaceResponse.data.spaceId;
    // console.log("spaceId " + spaceId);
  });

  test("Get a Space , returns 200 if given correct spaceId", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    expect(response.status).toBe(200);
    expect(response.data.dimensions).toBe("100x200");
    expect(response.data.elements.length).toBe(2);
  });
  test("Get a space gives 400 status code if incorrect spaceId is provided", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/AXROERRO`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    expect(response.status).toBe(400);
  });
  test("Add an element to a space", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        elementId: element1Id,
        spaceId,
        x: 50,
        y: 50,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    console.log("adding element" + response.data.message);
    const newResponse = await axios.get(
      `${BACKEND_URL}/api/v1/space/${spaceId}`,

      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    console.log("adding element" + newResponse.data.elements.length);

    expect(newResponse.data.elements.length).toBe(3);
  });

  test("Adding an element fails if the element lies outside the dimensions", async () => {
    const newResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        elementId: element1Id,
        spaceId: spaceId,
        x: 10000,
        y: 210000,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(newResponse.status).toBe(400);
  });

  test("Adding an element with incorrect elementId to a space", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        elementId: 0,
        spaceId,
        x: 50,
        y: 50,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.status).toBe(400);
  });
  test("Adding an element with incorrect spaceId", async () => {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/space/element`,
      {
        elementId: element1Id,
        spaceId: "EROROROR",
        x: 50,
        y: 50,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );
    expect(response.status).toBe(400);
  });
  test("Delete an element from a space", async () => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    console.log(response.data.elements);

    console.log(response.data.elements[0].id);
    const res = await axios.delete(`${BACKEND_URL}/api/v1/space/element`, {
      data: { id: response.data.elements[0].id },
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });
    console.log("res " + res.data.message);

    const newResponse = await axios.get(
      `${BACKEND_URL}/api/v1/space/${spaceId}`,
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    expect(newResponse.data.elements.length).toBe(2);
  });
});

describe("websocket tests", () => {
  let adminToken;
  let adminUserId;
  let userToken;
  let adminId;
  let userId;
  let mapId;
  let element1Id;
  let element2Id;
  let spaceId;
  let ws1;
  let ws2;
  let ws1Messages = [];
  let ws2Messages = [];
  let userX;
  let userY;
  let adminX;
  let adminY;
  
  function waitForAndPopLatestMessage(messageArray) {
    return new Promise(resolve => {
        if (messageArray.length > 0) {
          console.log( "message : " + messageArray[0].type)
            resolve(messageArray.shift())
        } else {
            let interval = setInterval(() => {
                if (messageArray.length > 0) {
                  console.log( "message inside interval: " + messageArray[0].type)
                    resolve(messageArray.shift())
                    clearInterval(interval)
                }
            }, 100)
        }
    })
}


  async function setupHTTP() {
    const username = `kirat-${Math.random()}`;
    const password = "123456";
    const adminSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username,
        password,
        type: "admin",
      }
    );

    const adminSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username,
        password,
      }
    );
    // console.log(adminSignupResponse)

    adminUserId = adminSignupResponse.data.userId;
    adminToken = adminSigninResponse.data.token;
    console.log("adminSignupResponse.status");
    console.log(adminSignupResponse.status);

    const userSignupResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signup`,
      {
        username: username + `-user`,
        password,
        type: "user",
      }
    );
    const userSigninResponse = await axios.post(
      `${BACKEND_URL}/api/v1/signin`,
      {
        username: username + `-user`,
        password,
      }
    );
    userId = userSignupResponse.data.userId;
    userToken = userSigninResponse.data.token;
    console.log("useroktne", userToken);
    const element1Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const element2Response = await axios.post(
      `${BACKEND_URL}/api/v1/admin/element`,
      {
        imageUrl:
          "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
        width: 1,
        height: 1,
        static: true,
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    element1Id = element1Response.data.id;
    element2Id = element2Response.data.id;

    const mapResponse = await axios.post(
      `${BACKEND_URL}/api/v1/admin/map`,
      {
        thumbnail: "https://thumbnail.com/a.png",
        dimensions: "100x200",
        name: "Defaul space",
        defaultElements: [
          {
            elementId: element1Id,
            x: 20,
            y: 20,
          },
          {
            elementId: element1Id,
            x: 18,
            y: 20,
          },
          {
            elementId: element2Id,
            x: 19,
            y: 20,
          },
        ],
      },
      {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      }
    );
    mapId = mapResponse.data.id;

    const spaceResponse = await axios.post(
      `${BACKEND_URL}/api/v1/space`,
      {
        name: "Test",
        dimensions: "100x200",
        mapId: mapId,
      },
      {
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      }
    );

    // console.log(spaceResponse.status);
    spaceId = spaceResponse.data.spaceId;
    console.log("userToken "  + userToken)
    console.log("adminToken " + adminToken) 
    console.log("spaceId " + spaceId)
  }

  async function setupWs() {
    ws1 = new WebSocket(WS_URL);

    ws1.onmessage = (event) => {
      // console.log("got back adata 1");
      // console.log(event.data);

      ws1Messages.push(JSON.parse(event.data));
    };
    await new Promise((r) => {
      ws1.onopen = r;
    });

    ws2 = new WebSocket(WS_URL);

    ws2.onmessage = (event) => {
      // console.log("got back data 2");
      // console.log(event.data);
      ws2Messages.push(JSON.parse(event.data));
    };
    await new Promise((r) => {
      ws2.onopen = r;
    });
  }
  beforeAll(async () => {
    await setupHTTP();
    await setupWs();
  });

  test.only("Get back ack for joining the space", async () => {
    console.log("insixce first test")
    ws1.send(JSON.stringify({
        "type": "join",
        "payload": {
            "spaceId": spaceId,
            "token": adminToken
        }
    }))
    console.log("insixce first test1")
    const message1 = await waitForAndPopLatestMessage(ws1Messages);
    console.log("m1" + message1.type)
    console.log("insixce first test2")
    ws2.send(JSON.stringify({
        "type": "join",
        "payload": {
            "spaceId": spaceId,
            "token": userToken
        }
    }))
    console.log("insixce first test3")

    const message2 = await waitForAndPopLatestMessage(ws2Messages);
    const message3 = await waitForAndPopLatestMessage(ws1Messages);
    
    console.log("m2" + message2.type)
    console.log("m3 useId" + message3.payload.userId)
    expect(message1.type).toBe("space-joined")
    expect(message2.type).toBe("space-joined")
    expect(message1.payload.users.length).toBe(0)
    expect(message2.payload.users.length).toBe(1)
    expect(message3.type).toBe("user-joined");
    expect(message3.payload.x).toBe(message2.payload.spawn.x);
    expect(message3.payload.y).toBe(message2.payload.spawn.y);
    expect(message3.payload.userId).toBe(userId);
    console.log("m2 spawn" +  message2.payload.spawn.x)
    adminX = message1.payload.spawn.x
    adminY = message1.payload.spawn.y
    console.log(adminX)
    userX = message2.payload.spawn.x
    userY = message2.payload.spawn.y
    console.log(userX)
  });

  test("User should not be able to move across the boundary of the wall", async () => {
    ws1.send(
      JSON.stringify({
        type: "move",
        payload: {
          x: 1000000,
          y: 10000,
        },
      })
    );

    const message = await waitForAndPopLatestMessage(ws1Messages);
    expect(message.type).toBe("movement-rejected");
    expect(message.payload.x).toBe(adminX);
    expect(message.payload.y).toBe(adminY);
  });

  test("User should not be able to move two blocks at the same time", async () => {
    ws1.send(
      JSON.stringify({
        type: "move",
        payload: {
          x: adminX + 2,
          y: adminY,
        },
      })
    );

    const message = await waitForAndPopLatestMessage(ws1Messages);
    expect(message.type).toBe("movement-rejected");
    expect(message.payload.x).toBe(adminX);
    expect(message.payload.y).toBe(adminY);
  });

  test("Correct movement should be broadcasted to the other sockets in the room", async () => {
    ws1.send(
      JSON.stringify({
        type: "move",
        payload: {
          x: adminX + 1,
          y: adminY,
          userId: adminId,
        },
      })
    );

    const message = await waitForAndPopLatestMessage(ws2Messages);
    expect(message.type).toBe("movement");
    expect(message.payload.x).toBe(adminX + 1);
    expect(message.payload.y).toBe(adminY);
  });

  test("If a user leaves, the other user receives a leave event", async () => {
    ws1.close();
    const message = await waitForAndPopLatestMessage(ws2Messages);
    expect(message.type).toBe("user-left");
    expect(message.payload.userId).toBe(adminUserId);
  });
});
