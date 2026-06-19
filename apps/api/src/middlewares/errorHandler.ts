import type { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    console.error(err.stack);   // TODO: sustituir por logger
    res.status(500).json({
        error: 'Error interno del servidor',
    });
};