import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: any) {
    return this.messagesService.findUserConversations(user.id);
  }

  @Get('conversations/:id')
  getMessages(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.findMessages(id, user.id);
  }

  @Post('conversations')
  createConversation(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body('participantIds') participantIds: string[],
    @Body('title') title?: string
  ) {
    return this.messagesService.createConversation(schoolId, user.id, participantIds, title);
  }

  @Post('conversations/:id/send')
  sendMessage(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser() user: any
  ) {
    return this.messagesService.sendMessage(user.id, id, content);
  }
}
