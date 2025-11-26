import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { My903Service } from 'src/my903/my903.service';

@Injectable()
export class TasksService {

    @Inject(My903Service)
    private readonly my903Service: My903Service;

    private readonly logger = new Logger(TasksService.name)

    // // 1. Cron 表达式：每秒执行一次（* * * * * *）
    // @Cron('* * * * * *')
    // handleCron() {
    //     this.logger.debug('Cron 任务：每秒执行一次');
    // }

    // // 2. 固定间隔：每3秒执行一次（单位：毫秒）
    // @Interval(3000)
    // handleInterval() {
    //     this.logger.debug('Interval 任务：每3秒执行一次');
    // }

    // 3. 延迟执行：应用启动后3秒执行一次
    @Timeout(3000)
    handleTimeout() {
        // this.my903Service.fetchNew('9')
        this.logger.debug('Timeout 任务：启动后3秒执行一次');
    }

    // 4. 复杂Cron：每天凌晨3点执行
     @Cron('0 0 10 * * *')
    handleDailyTask() {
        // this.fetchNew('9')

        // this.my903Service.fetchNew('9')
        this.logger.debug('每日任务：早上10点执行');
    }
}
