import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PROCUREMENT_STATUSES, REQUEST_PRIORITIES, RESOURCE_CONDITIONS, RESOURCE_STATUSES } from '../../common/domain';

export class CreateProcurementDto {
  @ApiPropertyOptional({ example: 'PROC-1001' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Server Blades v2' })
  @IsString()
  resourceType!: string;

  @ApiPropertyOptional({ example: 'Server Blades v2' })
  @IsOptional()
  @IsString()
  item?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'IT Services' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'pradhyum' })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({ example: 'pradhyum' })
  @IsOptional()
  @IsString()
  requester?: string;

  @ApiPropertyOptional({ example: 'U2' })
  @IsOptional()
  @IsString()
  requestedById?: string;

  @ApiPropertyOptional({ example: 'Requestor' })
  @IsOptional()
  @IsString()
  requesterRole?: string;

  @ApiPropertyOptional({ enum: PROCUREMENT_STATUSES, example: 'Pending Approval' })
  @IsOptional()
  @IsEnum(PROCUREMENT_STATUSES)
  status?: (typeof PROCUREMENT_STATUSES)[number];

  @ApiPropertyOptional({ enum: REQUEST_PRIORITIES, example: 'Normal' })
  @IsOptional()
  @IsEnum(REQUEST_PRIORITIES)
  priority?: (typeof REQUEST_PRIORITIES)[number];

  @ApiPropertyOptional({ example: 'May 4, 2026' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ example: 'Capacity increase required.' })
  @IsString()
  justification!: string;
}

export class UpdateProcurementDto extends PartialType(CreateProcurementDto) {
  @ApiPropertyOptional({ example: 'Dell' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: 'INV-2026-1001' })
  @IsOptional()
  @IsString()
  invoice?: string;
}

export class LogPurchaseDto {
  @ApiProperty({ example: 'Dell' })
  @IsString()
  vendor!: string;

  @ApiProperty({ example: 'INV-2026-1001' })
  @IsString()
  invoice!: string;
}

export class ProcurementRegistrationResourceDto {
  @ApiProperty({ example: 'RES-ITL-001' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ example: 'RES-ITL-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'r501' })
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

  @ApiProperty({ example: 'SN-1001' })
  @IsString()
  serialNumber!: string;

  @ApiPropertyOptional({ example: 'Block A - Room 12' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: RESOURCE_CONDITIONS, example: 'New' })
  @IsOptional()
  @IsEnum(RESOURCE_CONDITIONS)
  condition?: (typeof RESOURCE_CONDITIONS)[number];

  @ApiPropertyOptional({ enum: RESOURCE_STATUSES, example: 'Available' })
  @IsOptional()
  @IsEnum(RESOURCE_STATUSES)
  status?: (typeof RESOURCE_STATUSES)[number];

  @ApiPropertyOptional({ example: 'None' })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class RegisterProcurementDto {
  @ApiProperty({ type: [ProcurementRegistrationResourceDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProcurementRegistrationResourceDto)
  resources!: ProcurementRegistrationResourceDto[];
}
