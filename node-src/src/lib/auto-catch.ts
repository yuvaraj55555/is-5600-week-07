import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
type HandlerDictionary = { [key: string]: AsyncRequestHandler };

export function autoCatch(handlers: HandlerDictionary): HandlerDictionary {
  return Object.keys(handlers).reduce((autoHandlers: HandlerDictionary, key: string) => {
    const handler = handlers[key];
    autoHandlers[key] = (req: Request, res: Response, next: NextFunction) =>
      Promise.resolve(handler(req, res, next)).catch(next);
    return autoHandlers;
  }, {});
}
