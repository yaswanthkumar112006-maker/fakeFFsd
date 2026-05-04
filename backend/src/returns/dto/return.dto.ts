import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RESOURCE_CONDITIONS } from '../../common/domain';

export class ReturnProcessDto {
  @ApiProperty({ enum: RESOURCE_CONDITIONS, example: 'Good' })
  @IsEnum(RESOURCE_CONDITIONS)
  condition!: (typeof RESOURCE_CONDITIONS)[number];
}
