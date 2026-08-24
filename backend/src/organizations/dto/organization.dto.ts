import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class RegisterOrgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  subscriptionPlanId: string;
}
