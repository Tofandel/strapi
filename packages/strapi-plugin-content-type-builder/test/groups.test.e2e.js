const { registerAndLogin } = require('../../../test/helpers/auth');
const { createAuthRequest } = require('../../../test/helpers/request');
const waitRestart = require('../../../test/helpers/waitRestart');

let rq;

describe.only('Content Type Builder - Groups', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);
  }, 60000);

  describe('POST /groups', () => {
    test('Validates input and return 400 in case of invalid input', async () => {
      const res = await rq({
        method: 'POST',
        url: '/content-type-builder/groups',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: {
          attributes: ['attributes.required'],
          name: ['name.required'],
        },
      });
    });

    test('Creates a group properly', async () => {
      const res = await rq({
        method: 'POST',
        url: '/content-type-builder/groups',
        body: {
          name: 'some-group',
          attributes: {},
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toStrictEqual({
        data: {
          uid: 'some_group',
          schema: {
            name: 'some-group',
            connection: 'default',
            collectionName: 'groups_some_groups',
            attributes: {},
          },
        },
      });

      await waitRestart();
    }, 10000);

    test('Errors on already existing groups', async () => {
      const res = await rq({
        method: 'POST',
        url: '/content-type-builder/groups',
        body: {
          name: 'some-group',
          attributes: {},
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'group.alreadyExists',
      });
    });
  });

  describe('Get /groups', () => {
    test('Returns valid enveloppe', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-type-builder/groups',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.any(Array),
      });

      res.body.data.forEach(el => {
        expect(el).toMatchObject({
          uid: expect.any(String),
          schema: expect.objectContaining({}),
        });
      });
    });
  });

  describe('GET /groups/:uid', () => {
    test('Returns 404 on not found', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-type-builder/groups/nonexistent-group',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'group.notFound',
      });
    });

    test('Returns correct format', async () => {
      const res = await rq({
        method: 'GET',
        url: '/content-type-builder/groups/some_group',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toStrictEqual({
        data: {
          uid: 'some_group',
          schema: {
            name: 'some-group',
            connection: 'default',
            collectionName: 'some_groups',
            attributes: {
              //...
            },
          },
        },
      });
    });
  });

  describe('PUT /groups/:uid', () => {
    test('Throws 404 on updating non existent group', async () => {
      const res = await rq({
        method: 'PUT',
        url: '/content-type-builder/groups/nonexistent-groups',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'group.notFound',
      });
    });

    test('Validates input and return 400 in case of invalid input', async () => {
      const res = await rq({
        method: 'PUT',
        url: '/content-type-builder/groups/some_group',
        body: {
          attributes: {},
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: {
          name: ['name.required'],
        },
      });
    });

    test('Updates a group properly', async () => {
      const res = await rq({
        method: 'PUT',
        url: '/content-type-builder/groups/some_group',
        body: {
          name: 'New Group',
          attributes: {},
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toStrictEqual({
        data: {
          uid: 'new_group',
          schema: {
            name: 'New Group',
            connection: 'default',
            collectionName: 'some_groups',
            attributes: {},
          },
        },
      });

      await waitRestart();
    }, 10000);
  });

  describe('DELETE /groups/:uid', () => {
    test('Throws 404 on non existent group', async () => {
      const res = await rq({
        method: 'DELETE',
        url: '/content-type-builder/groups/nonexistent-groups',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'group.notFound',
      });
    });

    test('Deletes a group correctly', async () => {
      const res = await rq({
        method: 'DELETE',
        url: '/content-type-builder/groups/new_group',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toStrictEqual({
        data: {
          uid: 'new_group',
          schema: {
            name: 'New Group',
            connection: 'default',
            collectionName: 'some_groups',
            attributes: {},
          },
        },
      });

      await waitRestart();

      const tryGet = await rq({
        method: 'GET',
        url: '/content-type-builder/groups/new_group',
      });

      expect(tryGet.statusCode).toBe(404);
      expect(tryGet.body).toStrictEqual({
        error: 'group.notFound',
      });
    }, 10000);
  });
});
