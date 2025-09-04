import { Router } from 'express';
import { AccountController } from '../controllers/accountController';
import { validate, validationSchemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const accountController = new AccountController();

// CRUD 操作
router.get('/', asyncHandler(accountController.getAccounts));
router.get('/:id', asyncHandler(accountController.getAccountById));
router.post('/', validate(validationSchemas.account), asyncHandler(accountController.createAccount));
router.put('/:id', validate(validationSchemas.accountUpdate), asyncHandler(accountController.updateAccount));
router.delete('/:id', asyncHandler(accountController.deleteAccount));

// 状态管理
router.post('/:id/activate', asyncHandler(accountController.activateAccount));
router.post('/:id/deactivate', asyncHandler(accountController.deactivateAccount));
router.get('/:id/status', asyncHandler(accountController.getAccountStatus));
router.put('/status/bulk', validate(validationSchemas.bulkStatusUpdate), asyncHandler(accountController.bulkUpdateStatus));

// 统计查询
router.get('/:id/stats', asyncHandler(accountController.getAccountStats));
router.get('/stats/overview', asyncHandler(accountController.getAllAccountsStats));
router.get('/activity', asyncHandler(accountController.getAccountsActivity));
router.get('/trends', asyncHandler(accountController.getAccountsTrends));

export default router;