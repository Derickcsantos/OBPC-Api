import { CrudServiceContract, EntityRecord } from '../../src/types/crud.types.js';

export class FakeCrudService implements CrudServiceContract {
  constructor(private items: EntityRecord[] = []) {}

  async list(): Promise<EntityRecord[]> {
    return this.items;
  }

  async getById(id: string): Promise<EntityRecord> {
    const item = this.items.find((it) => Object.values(it).includes(id));
    if (!item) {
      throw new Error('not found');
    }
    return item;
  }

  async create(payload: EntityRecord): Promise<EntityRecord> {
    const item = {
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.items.push(item);
    return item;
  }

  async update(_id: string, payload: EntityRecord): Promise<EntityRecord> {
    return {
      ...payload,
      updated_at: new Date().toISOString(),
    };
  }

  async remove(_id: string): Promise<EntityRecord> {
    return { removed: true };
  }
}
