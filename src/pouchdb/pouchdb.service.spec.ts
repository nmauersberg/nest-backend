import { Test, TestingModule } from '@nestjs/testing';
import { PouchDBService } from './pouchdb.service';
import { Tools } from '../lib/tools.service';
import { config } from './database.config';
import { HttpException } from '@nestjs/common';
const rimraf = require('rimraf');
const fs = require('fs');
const tools = new Tools();

const testdata = require('../test/testdata');

describe('UsersService', () => {
  let pouchDBService: PouchDBService;
  let dbDir: string;

  beforeAll(() => {
    // create directory for testdatabases
    if (!fs.existsSync('testdatabase')) {
      fs.mkdirSync('testdatabase');
    };
  });

  beforeEach(async () => {
    const ranStr = tools.genRandomString(15);
    fs.mkdirSync(`testdatabase/${ranStr}`);
    dbDir = './testdatabase/' + ranStr;
    config.databasePath = dbDir;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PouchDBService],
    }).compile();

    pouchDBService = module.get<PouchDBService>(PouchDBService);
  });

  afterAll(async () => {
    await tools.stall(25);
    rimraf('testdatabase', fs, () => {});
  });

  it('should be defined', () => {
    expect(pouchDBService).toBeDefined();
  });

  it('should add document to the database', async () => {
    const testDB = 'testing';
    await pouchDBService.createDatabase(testDB);
    await pouchDBService.postDoc(testDB, 'test123', testdata.dummyData[0]);
    const result = await pouchDBService.fetch(testDB);
    expect(result.length).toEqual(1);
    expect(result[0].data).toBe('it is a test 1');
  });

  it('should fetch db with three docs', async () => {
    const testDB = 'testing';
    await pouchDBService.createDatabase(testDB);
    testdata.dummyData.forEach(async (dataset: { data: string }, index: number) => {
      await pouchDBService.postDoc(testDB, `test${index + 1}`, dataset);
    })
    const result = await pouchDBService.fetch(testDB);
    expect(result.length).toEqual(3);
  });

  it('should fetch a single document by id', async () => {
    const testDB = 'testing';
    await pouchDBService.createDatabase(testDB);
    testdata.dummyData.forEach(async (dataset: { data: string }, index: number) => {
      await pouchDBService.postDoc(testDB, `test${index + 1}`, dataset);
    });
    const fetchedElement = await pouchDBService.getDoc(testDB, 'test2');
    expect(fetchedElement._id).toEqual('test2');
  });

  it('should update a document', async () => {
    const testDB = 'testing';
    await pouchDBService.createDatabase(testDB);
    testdata.dummyData.forEach(async (dataset: { data: string }, index: number) => {
      await pouchDBService.postDoc(testDB, `test${index + 1}`, dataset);
    });
    const fetchedElement: any = await pouchDBService.getDoc(testDB, 'test2');
    fetchedElement.data = 'I was updated!';
    await pouchDBService.putDoc(testDB, fetchedElement._id, fetchedElement);
    const refetchedElement: any = await pouchDBService.getDoc(testDB, 'test2');
    expect(refetchedElement.data).toEqual('I was updated!');
  });

  it('should fetch only documents by user id owning it', async () => {
    const testDB = 'testing';
    await pouchDBService.createDatabase(testDB);

    const randomString = tools.genRandomString(25);
    const createdAt = (new Date()).toISOString();
    const newUserId = `${createdAt}-${randomString}`;
    const newDocId = `${(new Date()).toISOString()}-${Math.random().toString(36).substr(2, 9)}-${newUserId}-${testDB}`

    testdata.dummyData.forEach(async (dataset: { data: string }, index: number) => {
      let docId = `test${index + 1}`;
      if (index === 1) {
        docId = newDocId;
      }
      await pouchDBService.postDoc(testDB, docId, dataset);
    })

    const fetchedElement = await pouchDBService.getOwnDocs(testDB, newUserId);

    expect(fetchedElement[0]._id).toEqual(newDocId);
    expect(fetchedElement.length).toEqual(1);
  });

  it('should remove a document from db', async () => {
    const testDB = 'testing';
    await pouchDBService.createDatabase(testDB);
    testdata.dummyData.forEach(async (dataset: { data: string }, index: number) => {
      await pouchDBService.postDoc(testDB, `test${index + 1}`, dataset);
    })
    const elementToDelete = await pouchDBService.getDoc(testDB, 'test2');
    await pouchDBService.remDoc(testDB, elementToDelete);
    const result = await pouchDBService.fetch(testDB);
    expect(result.length).toEqual(2);
  });

  it('destroy a db, removing all documents', async () => {
    const testDB = 'testing';
    await pouchDBService.createDatabase(testDB);
    testdata.dummyData.forEach(async (dataset: { data: string }, index: number) => {
      await pouchDBService.postDoc(testDB, `test${index + 1}`, dataset);
    })
    await pouchDBService.destroyDatabase(testDB);
    const result = await pouchDBService.fetch(testDB);
    expect(result.length).toEqual(0);
  });

  it('throw exeption when access to prefixed db is requested', async () => {
    const accessDenied = '_testing';
    const accessGranted = 'testing';
    const exceptionExpected = () => {
      pouchDBService.checkDbName(accessDenied);
    }
    const exceptionNotExpected = () => {
      pouchDBService.checkDbName(accessGranted);
    }
    expect(exceptionExpected).toThrow(HttpException);
    expect(exceptionNotExpected).not.toThrow();
  });

  it('throw exeption when userId is not included in docId', async () => {
    const testDB = 'testing';
    const randomString = tools.genRandomString(25);
    const createdAt = (new Date()).toISOString();
    const userId = `${createdAt}-${randomString}`;
    const docId = pouchDBService.genDocId(testDB, userId);
    const invalidId = () => pouchDBService.checkDocId(docId, 'test-123');
    const validId = () => pouchDBService.checkDocId(docId, userId);
    expect(invalidId).toThrow(HttpException);
    expect(validId).not.toThrow();
  });
});
