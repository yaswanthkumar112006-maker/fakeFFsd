import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { RESOURCE_CONDITIONS, RESOURCE_STATUSES } from '../../common/domain';

export class CreateResourceDto {
  @ApiProperty({ example: 'RES-ITL-001' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ example: 'RES-ITL-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'r101' })
  @IsOptional()
  @IsString()
  internalId?: string;

  @ApiProperty({ example: 'Laptop' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ example: 'Dell Latitude 5440' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'IT Services' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'SN-1001' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ enum: RESOURCE_STATUSES, example: 'Available' })
  @IsOptional()
  @IsEnum(RESOURCE_STATUSES)
  status?: (typeof RESOURCE_STATUSES)[number];

  @ApiPropertyOptional({ enum: RESOURCE_CONDITIONS, example: 'Good' })
  @IsOptional()
  @IsEnum(RESOURCE_CONDITIONS)
  condition?: (typeof RESOURCE_CONDITIONS)[number];

  @ApiPropertyOptional({ example: 'Dell' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: 'INV-1001' })
  @IsOptional()
  @IsString()
  invoice?: string;

  @ApiPropertyOptional({ example: 'Block A - Room 12' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'None' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ example: 'U1' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'May 4, 2026' })
  @IsOptional()
  @IsString()
  date?: string;
}

export class UpdateResourceDto extends PartialType(CreateResourceDto) {}

export class UpdateCatalogDto {
  @ApiProperty({ example: 'IT Services' })
  @IsString()
  department!: string;

  @ApiProperty({ example: ['Laptop', 'Projector'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  resourceTypes!: string[];
}
