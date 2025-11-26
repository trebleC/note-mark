import { PartialType } from '@nestjs/mapped-types';
import { CreateMinioDTO } from './create-minio.dto';

export class UpdateMinioDTO extends PartialType(CreateMinioDTO) {}
