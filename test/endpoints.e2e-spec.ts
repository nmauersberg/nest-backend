import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PouchDBModule } from '../src/pouchdb/pouchdb.module';
import { AuthModule } from '../src/auth/auth.module';
import { Tools } from '../src/lib/tools.service';
import { config } from '../src/pouchdb/database.config';
const rimraf = require('rimraf');
const fs = require('fs');
const tools = new Tools();

const testdata = require('./testdata');

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dbDir: string;
  let authToken: string;

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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PouchDBModule, AuthModule],
    })
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    const testUser = {
      email: 'test@test.de',
      role: 'customer',
      username: 'testuser',
      password: 'testPassword123',
      newsletterConsent: true
    }
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-API-KEY', process.env.API_KEY)
      .send(testUser);

    const loginRequest = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-API-KEY', process.env.API_KEY)
      .send({
        username: testUser.username,
        password: testUser.password
      });

    authToken = loginRequest.body.access_token;
  });

  afterAll(async () => {
    await tools.stall(25);
    rimraf('testdatabase', fs, () => {});
  });

  it('should be "Unauthorized" without auth token', async () => {
    await request(app.getHttpServer())
      .get('/pouch/fetch/_users')
      .set('X-API-KEY', process.env.API_KEY)
      .expect(401);
    await request(app.getHttpServer())
      .get('/pouch/fetch/anyUnprefixedDB')
      .set('X-API-KEY', process.env.API_KEY)
      .expect(401);
  });

  it('should be able to access database with auth token', async () => {
    await request(app.getHttpServer())
      .get('/pouch/fetch/anyUnprefixedDB')
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + authToken)
      .expect(200);
  });

  it('should register new user', async () => {
    // Arrange
    const testUser = {
      email: 'test1@test.de',
      role: 'customer',
      username: 'testuser1',
      password: 'testPassword123',
      newsletterConsent: true
    }
    // Act
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-API-KEY', process.env.API_KEY)
      .send(testUser)
      .expect(201)
    // Assert
    expect(register.body.message).toBe('user created!')
  });

  it('should login demo user and receive access token', async () => {
    // Arrange
    const credentials = {
      username: 'testuser',
      password: 'testPassword123'
    }
    // Act
    const loginRequest = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-API-KEY', process.env.API_KEY)
      .send(credentials)
      .expect(201);
    // Assert
    expect(loginRequest.body.access_token).toBeDefined();
  });

  it('should post document', async () => {
    // Arrange
    const testDB = 'testing';
    // Act
    // post document to test db
    const doc = await request(app.getHttpServer())
      .post(`/pouch/post-doc/${testDB}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + authToken)
      .send(testdata.dummyData[0])
      .expect(201);
    // Assert
    // fetch db with all documents
    const docs = await request(app.getHttpServer())
      .get(`/pouch/fetch/${testDB}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + authToken)
      .expect(200);
    expect(doc.ok).toBeTruthy();
    expect(docs.body[0].data).toEqual('it is a test 1');
  });

  it('should update existing document', async () => {
    // Arrange
    const testDB = 'testing';
    // post document to test db
    await request(app.getHttpServer())
      .post(`/pouch/post-doc/${testDB}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + authToken)
      .send(testdata.dummyData[0])
      .expect(201);
    // fetch db with all documents
    const docs = await request(app.getHttpServer())
      .get(`/pouch/fetch/${testDB}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + authToken)
      .expect(200);
    // update data prop with new info
    const fetchedDoc = { ...docs.body[0] };
    fetchedDoc.data = 'I was updated!';
    // Act
    // send updated document to database
    await request(app.getHttpServer())
      .post(`/pouch/put-doc/${testDB}/${fetchedDoc._id}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + authToken)
      .send(fetchedDoc)
      .expect(201);
    // Assert
    // get document from db
    const updatedDoc = await request(app.getHttpServer())
      .get(`/pouch/get-doc/${testDB}/${fetchedDoc._id}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + authToken)
      .expect(200);
    expect(updatedDoc.body.data).toEqual('I was updated!');
  });

  it('should get user owned documents', async () => {
    // Arrange
    const testDB = 'testing';
    // post documents to test db from demo user
    await request(app.getHttpServer())
      .post(`/pouch/post-doc/${testDB}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + authToken)
      .send(testdata.dummyData[0])
      .expect(201);
    // add second user
    const testUser = {
      email: 'test1@test.de',
      role: 'customer',
      username: 'testuser1',
      password: 'testPassword123',
      newsletterConsent: true
    }
    await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-API-KEY', process.env.API_KEY)
      .send(testUser)
      .expect(201)
    const credentials = {
      username: 'test1@test.de',
      password: 'testPassword123'
    }
    const loginRequest = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-API-KEY', process.env.API_KEY)
      .send(credentials)
      .expect(201);
    const secondToken = loginRequest.body.access_token;
    // post document with second user token
    await request(app.getHttpServer())
      .post(`/pouch/post-doc/${testDB}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + secondToken)
      .send(testdata.dummyData[1])
      .expect(201);
    // Act
    // get user documents from db
    const ownDocs = await request(app.getHttpServer())
      .get(`/pouch/get-own-docs/${testDB}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + secondToken)
      .expect(200);
    // Assert
    // get all docs to verify total count of docs
    const allDocs = await request(app.getHttpServer())
      .get(`/pouch/fetch/${testDB}`)
      .set('X-API-KEY', process.env.API_KEY)
      .set('Authorization', 'bearer ' + secondToken)
      .expect(200);
    expect(ownDocs.body.length).toBe(1);
    expect(ownDocs.body[0].data).toBe('it is a test 2');
    expect(allDocs.body.length).toBe(2);
  });
});
