import { PartialType } from '@nestjs/swagger';
import { CreateRedNoteDTO } from './create-red-note.dto';

export class UpdateRedNoteDTO extends PartialType(CreateRedNoteDTO) {}
