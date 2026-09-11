import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';

@UseGuards(JwtAuthGuard)
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
    @Body('participantIds') participantIds: string[],
    @Body('title') title?: string
  ) {
    return this.messagesService.createConversation(schoolId, participantIds, title);
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
