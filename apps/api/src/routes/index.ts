import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Endpoint de comprobación (Health Check)
router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        message: "Hello World! API funcionando correctamente."
    })
})

export default router;