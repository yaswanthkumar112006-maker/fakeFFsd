import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { AnnouncementType } from '../../common/domain';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsIn(['Maintenance', 'New Feature', 'Policy', 'General'])
  type: AnnouncementType;

  @IsString()
  @IsNotEmpty()
  targetOrgId: string; // 'ALL' or specific ORG ID
}
