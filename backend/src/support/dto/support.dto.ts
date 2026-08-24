import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { TicketStatus } from '../../common/domain';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class ResolveTicketDto {
  @IsString()
  @IsNotEmpty()
  reply: string;

  @IsOptional()
  @IsString()
  @IsIn(['Open', 'In Progress', 'Resolved'])
  status?: TicketStatus;
}
