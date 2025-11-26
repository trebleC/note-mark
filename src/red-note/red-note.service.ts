import { Injectable } from '@nestjs/common';
import { CreateRedNoteDTO } from './dto/create-red-note.dto';
import { UpdateRedNoteDTO } from './dto/update-red-note.dto';

@Injectable()
export class RedNoteService {
  create(CreateRedNoteDTO: CreateRedNoteDTO) {
    return 'This action adds a new redNote';
  }

  findAll() {
    return `This action returns all redNote`;
  }

  findOne(id: number) {
    return `This action returns a #${id} redNote`;
  }

  update(id: number, updateRedNoteDTO: UpdateRedNoteDTO) {
    return `This action updates a #${id} redNote`;
  }

  remove(id: number) {
    return `This action removes a #${id} redNote`;
  }
}
