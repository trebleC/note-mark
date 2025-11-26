import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { My903Module } from 'src/my903/my903.module';

@Module({
  imports: [
    My903Module,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
