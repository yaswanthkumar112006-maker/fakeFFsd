import { IsString, IsNotEmpty, IsEmail, Matches } from 'class-validator';
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from '../../common/password';

export class RegisterOrgDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  // This becomes the login password for the System Admin account this registration
  // provisions for adminEmail — see OrganizationsService#register.
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_RULE_MESSAGE })
  password: string;

  @IsString()
  @IsNotEmpty()
  subscriptionPlanId: string;
}
