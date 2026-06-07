import { Module } from '@nestjs/common';
import { ProtocolController } from './controllers/protocol.controller';

@Module({ controllers: [ProtocolController] })
export class ProtocolModule {}
