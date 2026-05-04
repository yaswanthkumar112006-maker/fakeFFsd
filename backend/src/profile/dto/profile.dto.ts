import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Asha Nair' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifications?: boolean;
}

export class UpdatePasswordDto {
  @ApiProperty({ example: 'current123' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
