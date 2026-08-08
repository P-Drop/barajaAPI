import type { Request, Response, NextFunction } from 'express';

// req.baseUrl es MUTABLE: Express lo restaura al desapilar los routers cuando
// un error viaja con next(err), y res.on('finish') corre después de eso.
// Aquí se congela el prefijo montado mientras la pila sigue en pie.
export const tagRoutePrefix = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.routePrefix = req.baseUrl;
  next();
};
