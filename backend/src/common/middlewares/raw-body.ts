import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as express from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.baseUrl.startsWith('/api/auth')) {
      next();
      return;
    }

    // Otherwise, parse the body as usual
    express.json()(req, res, (err) => {
      if (err) {
        next(err); // Pass any errors to the error-handling middleware
        return;
      }
      express.urlencoded({ extended: true })(req, res, next);
    });
  }
}
