import { Model } from "sequelize";
import {
  PERMISSION_NAME_LEN_ERROR,
  PERMISSION_NAME_EMPTY_ERROR,
  PERMISSION_DESCRIPTION_EMPTY_ERROR,
  PERMISSION_INVALID_NAME_ERROR,
} from "~helpers/constants/i18n";
import { ROLE_PERMISSIONS_JOIN_TABLE } from "~helpers/constants/models";
import { actions, resources } from "~helpers/constants/permission";

export default (sequelize, DataTypes) => {
  class Permission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Permission.belongsToMany(models.Role, {
        through: ROLE_PERMISSIONS_JOIN_TABLE,
      });
    }
  }
  Permission.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        validate: {
          isUUID: 4,
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: {
            args: [1, 64],
            msg: PERMISSION_NAME_LEN_ERROR,
          },
          notEmpty: {
            msg: PERMISSION_NAME_EMPTY_ERROR,
          },
          isAlphanumeric: {
            msg: PERMISSION_INVALID_NAME_ERROR,
          },
        },
      },
      action: {
        type: DataTypes.ENUM(actions),
        allowNull: false,
      },
      resource: {
        type: DataTypes.ENUM(resources),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: {
            msg: PERMISSION_DESCRIPTION_EMPTY_ERROR,
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Permission",
    }
  );
  return Permission;
};