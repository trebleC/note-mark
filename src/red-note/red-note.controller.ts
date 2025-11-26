import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RedNoteService } from './red-note.service';
import { CreateRedNoteDTO } from './dto/create-red-note.dto';
import { UpdateRedNoteDTO } from './dto/update-red-note.dto';

@Controller('red-note')
export class RedNoteController {
  constructor(private readonly redNoteService: RedNoteService) {}

  @Post()
  create(@Body() createRedNoteDTO: CreateRedNoteDTO) {
    return this.redNoteService.create(createRedNoteDTO);
  }

  @Get()
  findAll() {
    return this.redNoteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.redNoteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRedNoteDTO: UpdateRedNoteDTO) {
    return this.redNoteService.update(+id, updateRedNoteDTO);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.redNoteService.remove(+id);
  }
}
