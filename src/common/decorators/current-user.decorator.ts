// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('Request User:', request['data']);
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Usage: @CurrentUser() user, @CurrentUser('id') userId
