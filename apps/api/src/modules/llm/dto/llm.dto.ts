import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LlmChatDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  organizationId?: string;
}
