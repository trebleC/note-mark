import { Module } from '@nestjs/common';
import { RedNoteService } from './red-note.service';
import { RedNoteController } from './red-note.controller';

@Module({
  controllers: [RedNoteController],
  providers: [RedNoteService],
})
export class RedNoteModule {}
