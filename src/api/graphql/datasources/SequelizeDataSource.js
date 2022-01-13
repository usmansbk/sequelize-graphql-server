/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
import { DataSource } from "apollo-datasource";
import DataLoader from "dataloader";
import QueryError from "~utils/errors/QueryError";
import { ITEM_NOT_FOUND } from "~helpers/constants/i18n";

/**
 * The SequelizeDataSource abstract class helps you query data from an SQL database. Your server
 * defines a separate subclass of SequelizeDataSource for each Model it communicates with.
 * It is configured with a Dataloader to prevent the N+1 problem (loading the same object multiple times during a single request).
 *
 * The onCreate, onUpdate, and onDestroy hooks can be overwritten in the child classes.
 *
 * Subclasses with catch exceptions they can handle and rethrow unknown errors
 */
export default class SequelizeDataSource extends DataSource {
  constructor(model) {
    super();
    this.model = model;
    this.loader = new DataLoader(async (ids) => {
      const result = await this.model.findAll({
        where: {
          id: ids,
        },
      });

      const map = {};
      result.forEach((elem) => {
        map[elem.id] = elem;
      });

      return ids.map((id) => map[id]);
    });
  }

  initialize({ context } = {}) {
    this.context = context;
  }

  onCreate(_newImage) {}

  onUpdate(_oldImage, _newImage) {}

  onDestroy(_oldImage) {}

  async prime(item) {
    this.loader.prime(item.id, item);
  }

  primeMany(items) {
    items.forEach((item) => this.prime(item));
  }

  findByPk(id) {
    return this.loader.load(id);
  }

  findManyByPk(ids = []) {
    return this.loader.loadMany(ids);
  }

  async findOne(query) {
    const item = await this.model.findOne(query);
    if (item) {
      this.prime(item);
    }

    return item;
  }

  async findAll(query) {
    const items = await this.model.findAll(query);
    this.primeMany(items);

    return items;
  }

  async findAndCountAll(query) {
    const { count, rows } = await this.model.findAndCountAll(query);
    this.primeMany(rows);

    return { count, rows };
  }

  async findOrCreate(queryOptions) {
    const [item, created] = await this.model.create(queryOptions);
    if (item) {
      this.prime(item);
    }

    if (created) {
      const newImage = item.toJSON();
      this.onCreate(newImage);
    }

    return [item, created];
  }

  async create(fields) {
    const item = await this.model.create(fields);
    const newImage = item.toJSON();
    this.prime(item);
    this.onCreate(newImage);

    return item;
  }

  async update(id, fields) {
    const item = await this.findByPk(id);

    if (!item) {
      throw new QueryError(ITEM_NOT_FOUND);
    }

    const oldImage = item.toJSON();

    const newItem = await item.update(fields);
    const newImage = newItem.toJSON();

    this.prime(newItem);
    this.onUpdate(oldImage, newImage);

    return newItem;
  }

  /**
   * Delete is idemponent and shouldn't throw an error if item does not exist
   */
  async destroy(id) {
    const item = await this.findByPk(id);
    if (item) {
      const oldImage = item.toJSON();
      await item.destroy();
      this.onDestroy(oldImage);
    }
  }
}