import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import PouchDB = require('pouchdb');
import { config } from './database.config';

@Injectable()
export class PouchDBService {

  dbPath: string;

  constructor() {
    this.dbPath = config.databasePath;
  }

  async createDatabase(database: string) {
    try {
      new PouchDB(`${config.databasePath}/${database}`);
    } catch (e) {
      console.log(e);
    };
  }

  async fetch(database: string) {
    const db = new PouchDB(`${config.databasePath}/${database}`);
    let data: Array<any>;
    try {
      const alldocs = await db.allDocs({
        include_docs: true,
        attachments: false
      });
      data = alldocs.rows.map(row => row.doc);
    } catch (err) {
      throw new Error(err.message);
    };
    return data;
  };

  async postDoc(database: string, id: string, data: any) {
    const db = new PouchDB(`${config.databasePath}/${database}`);
    try {
      const res = await db.put({
        _id: id,
        ...data
      });
      return res;
    } catch (e) {
      throw new Error(e);
    };
  };

  async putDoc(database: string, id: string, data: any) {
    let db = new PouchDB(`${this.dbPath}/${database}`);
    try {
      let doc = await db.get(id);
      let res = await db.put({
        _id: id,
        _rev: doc._rev,
        ...doc = data
      });
      return res;
    } catch (e) {
      throw new Error(e);
    };
  };

  async getDoc(database: string, id: string): Promise<{ _id: string, _rev: string }> {
    let db = new PouchDB(`${this.dbPath}/${database}`);
    try {
      let doc = await db.get(id);
      return doc;
    } catch (e) {
      throw new Error(e);
    };
  };

  async getOwnDocs(database: string, userId: string) {
    new PouchDB(`${this.dbPath}/${database}`);
    try {
      const dbContent = await this.fetch(database);
      const ownDocs = dbContent.filter(el => el._id.includes(userId));
      return ownDocs;
    } catch (e) {
      throw new Error(e);
    };
  };

  async remDoc(database: string, data: any) {
    let db = new PouchDB(`${this.dbPath}/${database}`);
    try {
      let toRemove = await db.get(data._id);
      let result = await db.remove(toRemove);
      return result;
    } catch (e) {
      throw new Error(e);
    };
  };

  async destroyDatabase(database: string) {
    let db = new PouchDB(`${this.dbPath}/${database}`);
    try {
      let result = await db.destroy();
      return result;
    } catch (e) {
      throw new Error(e);
    };
  };

  checkDbName(dbName: string) {
    if (dbName.startsWith('_', 0)) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  checkDocId(docId: string, userId: string) {
    if (!docId.includes(userId)) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  genDocId(database: string, userId: string) {
    const id = `${(new Date()).toISOString()}-${Math.random().toString(36).substr(2, 9)}-${userId}-${database}`;
    return id;
  }
}
