import { Controller, Request, Post, Get, UseGuards, Param } from '@nestjs/common';
import { RequestUser, RequestUserBody } from 'src/types/user.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PouchDBService } from './pouchdb.service';

@Controller('pouch')
export class PouchDBController {
  constructor(
    private pouchDBService: PouchDBService
  ) {}

  // Is this required in production mode? Could be abused.
  @UseGuards(JwtAuthGuard)
  @Get('fetch/:dbName')
  async getDatabase(@Param() params: { dbName: string }) {
    // Check for admin rights?
    this.pouchDBService.checkDbName(params.dbName);
    const dbData = await this.pouchDBService.fetch(params.dbName);
    return dbData;
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-doc/:dbName/:docId')
  async getDocument(
    @Request() req: RequestUser,
    @Param() params: { dbName: string, docId: string }
  ) {
    this.pouchDBService.checkDocId(params.docId, req.user._id);
    const dbData = await this.pouchDBService.getDoc(params.dbName, params.docId);
    return dbData;
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-own-docs/:dbName')
  async getOwnDocs(
    @Request() req: RequestUser,
    @Param() params: { dbName: string }
  ) {
    this.pouchDBService.checkDbName(params.dbName);
    const dbData = await this.pouchDBService.getOwnDocs(params.dbName, req.user._id);
    return dbData;
  }

  @UseGuards(JwtAuthGuard)
  @Post('post-doc/:dbName')
  async postDocument(
    @Request() req: RequestUserBody,
    @Param() params: { dbName: string }
  ) {
    this.pouchDBService.checkDbName(params.dbName);
    const newDocId = this.pouchDBService.genDocId(params.dbName, req.user._id);
    const dbData = await this.pouchDBService.postDoc(params.dbName, newDocId, req.body);
    return dbData;
  }

  @UseGuards(JwtAuthGuard)
  @Post('put-doc/:dbName/:docId')
  async putDocument(
    @Request() req: RequestUserBody,
    @Param() params: { dbName: string, docId: string }
  ) {
    this.pouchDBService.checkDbName(params.dbName);
    this.pouchDBService.checkDocId(params.docId, req.user._id);
    const dbData = await this.pouchDBService.putDoc(params.dbName, params.docId, req.body);
    return dbData;
  }
}