import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateStockThresholdParamDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  level!: number;
}
