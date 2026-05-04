import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'D101' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'IT Services' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Pradhyum' })
  @IsString()
  head!: string;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(0)
  memberCount!: number;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
