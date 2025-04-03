import { All, Controller, Req, Res } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../lib/auth';

@Controller()
export class AuthController {
  @All('api/auth/*')
  async auth(@Req() req: Request, @Res() res: Response) {
    return toNodeHandler(auth)(req as any, res as any);
  }
}
