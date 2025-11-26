import { Controller, Inject, Get } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { My903Service } from 'src/my903/my903.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Inject(My903Service)
  private readonly my903Service: My903Service;

  @Get('fetchNew')
  fetchNew() {
    return this.my903Service.fetchNew('9');
  }
}
