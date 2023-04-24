import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // canActivate(context: ExecutionContext) {
  //   const ctx = GqlExecutionContext.create(context);
  //   const { req } = ctx.getContext();
  //   console.log(req);
  //   return super.canActivate(new ExecutionContextHost([req]));
  // }
  // constructor(private readonly reflector: Reflector) {
  //   super();
  // }
  // canActivate(context: ExecutionContext) {
  //   // Add your custom authentication logic here
  //   // for example, call super.logIn(request) to establish a session.
  //   console.log('canActivate');
  //   return super.canActivate(context);
  // }
  // handleRequest(err, user, info, context) {
  //   console.log('handleRequest', user);
  //   return user;
  // }
}
