import QueryError from "~utils/errors/QueryError";
import { Fail, Success } from "~helpers/response";

export default {
  Query: {
    roles(_parent, { page, filter }, { dataSources }, info) {
      return dataSources.roles.paginate({
        page,
        filter,
        info,
        skip: ["members"],
      });
    },
  },
  Mutation: {
    async createRole(
      _parent,
      { input: { permissionIds, ...values } },
      { dataSources, db, t }
    ) {
      try {
        const role = await db.sequelize.transaction(async (transaction) => {
          const newRole = await dataSources.roles.create(values, {
            transaction,
          });

          if (permissionIds?.length) {
            await newRole.addPermissions(permissionIds, { transaction });
          }
          return newRole;
        });
        return Success({ role });
      } catch (e) {
        if (e instanceof QueryError) {
          return Fail({
            message: t(e.message),
            errors: e.errors,
            code: e.code,
          });
        }

        throw e;
      }
    },
    async updateRole(
      _parent,
      { input: { id, ...values } },
      { dataSources, t }
    ) {
      try {
        const role = await dataSources.roles.update(id, values);
        return Success({ role });
      } catch (e) {
        if (e instanceof QueryError) {
          return Fail({
            message: t(e.message),
            errors: e.errors,
            code: e.code,
          });
        }

        throw e;
      }
    },
    async deleteRoles(_parent, { ids }, { dataSources, t }) {
      try {
        await dataSources.roles.destroyMany(ids);
        return Success({ ids });
      } catch (e) {
        if (e instanceof QueryError) {
          return Fail({
            message: t(e.message),
            errors: e.errors,
            code: e.code,
          });
        }

        throw e;
      }
    },
    async attachPermissionsToRole(
      _parent,
      { roleId, permissionIds },
      { dataSources, db, t }
    ) {
      try {
        const role = await db.sequelize.transaction(async (transaction) => {
          const foundRole = await dataSources.roles.findOne({
            where: {
              id: roleId,
            },
            transaction,
          });
          await foundRole.addPermissions(permissionIds, { transaction });
          return foundRole;
        });
        return Success({ role });
      } catch (e) {
        if (e instanceof QueryError) {
          return Fail({
            message: t(e.message),
            errors: e.errors,
            code: e.code,
          });
        }

        throw e;
      }
    },
    async detachPermissionsFromRole(
      _parent,
      { roleId, permissionIds },
      { dataSources, db, t }
    ) {
      try {
        const role = await db.sequelize.transaction(async (transaction) => {
          const foundRole = await dataSources.roles.findOne({
            where: {
              id: roleId,
            },
            transaction,
          });
          await foundRole.removePermissions(permissionIds, { transaction });
          return foundRole;
        });
        return Success({ role });
      } catch (e) {
        if (e instanceof QueryError) {
          return Fail({
            message: t(e.message),
            errors: e.errors,
            code: e.code,
          });
        }

        throw e;
      }
    },
    async detachRoleFromAllMembers(
      _parent,
      { roleId },
      { dataSources, db, t }
    ) {
      try {
        const role = await db.sequelize.transaction(async (transaction) => {
          const foundRole = await dataSources.roles.findOne({
            where: {
              id: roleId,
            },
            transaction,
          });
          const members = await foundRole.getMembers({ transaction });
          await foundRole.removeMembers(members, { transaction });
          return foundRole;
        });
        return Success({ role });
      } catch (e) {
        if (e instanceof QueryError) {
          return Fail({
            message: t(e.message),
            errors: e.errors,
            code: e.code,
          });
        }

        throw e;
      }
    },
  },
};