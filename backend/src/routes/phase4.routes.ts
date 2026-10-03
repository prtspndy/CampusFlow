import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.middleware.js';
import { requireAnyPermission, requirePermission } from '../middleware/authorize.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { hasPermission } from '../types/auth.js';
import {
  adjustStockSchema,
  announcementIdParamSchema,
  createAnnouncementSchema,
  createOrderSchema,
  createProductSchema,
  listAnnouncementsQuerySchema,
  listOrdersQuerySchema,
  listProductsQuerySchema,
  orderIdParamSchema,
  paginationQuerySchema,
  productIdParamSchema,
  updateAnnouncementSchema,
  updateProductSchema,
  CreateAnnouncementInput,
  CreateOrderInput,
  CreateProductInput,
  ListAnnouncementsQuery,
  ListProductsQuery,
  UpdateAnnouncementInput,
  UpdateProductInput,
  AdjustStockInput,
} from '../validators/phase4.validators.js';
import {
  createProduct,
  getProduct,
  listProducts,
  setVariantStock,
  updateProduct,
} from '../services/product.service.js';
import { cancelOrder, createOrder, getOrder, listAllOrders, listOwnOrders } from '../services/order.service.js';
import {
  createAnnouncement,
  getAnnouncement,
  listManaged,
  listPublished,
  setPublished,
  updateAnnouncement,
} from '../services/announcement.service.js';

export const productRouter = Router();
export const orderRouter = Router();
export const announcementRouter = Router();

productRouter.get(
  '/',
  optionalAuthenticate,
  validateQuery(listProductsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListProductsQuery;
    const includeInactive = Boolean(
      req.user && hasPermission(req.user.role, 'merchandise.manage'),
    );
    const result = await listProducts(query, includeInactive);
    return sendSuccess(res, result, 'Products retrieved successfully');
  }),
);

productRouter.post(
  '/',
  authenticate,
  requirePermission('merchandise.manage'),
  validateBody(createProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await createProduct(req.body as CreateProductInput);
    return sendSuccess(res, product, 'Product created', 201);
  }),
);

productRouter.get(
  '/:productId',
  optionalAuthenticate,
  validateParams(productIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = Boolean(
      req.user && hasPermission(req.user.role, 'merchandise.manage'),
    );
    const product = await getProduct(req.params.productId!, includeInactive);
    return sendSuccess(res, product, 'Product retrieved successfully');
  }),
);

productRouter.patch(
  '/:productId',
  authenticate,
  requirePermission('merchandise.manage'),
  validateParams(productIdParamSchema),
  validateBody(updateProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await updateProduct(req.params.productId!, req.body as UpdateProductInput);
    return sendSuccess(res, product, 'Product updated');
  }),
);

productRouter.patch(
  '/:productId/stock',
  authenticate,
  requirePermission('merchandise.manage'),
  validateParams(productIdParamSchema),
  validateBody(adjustStockSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const product = await setVariantStock(req.params.productId!, req.body as AdjustStockInput);
    return sendSuccess(res, product, 'Stock updated');
  }),
);

orderRouter.post(
  '/',
  authenticate,
  requirePermission('orders.create'),
  validateBody(createOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await createOrder(req.user!, req.body as CreateOrderInput);
    return sendSuccess(
      res,
      result,
      result.alreadyExisted ? 'Existing order returned' : 'Order placed',
      result.alreadyExisted ? 200 : 201,
    );
  }),
);

orderRouter.get(
  '/me',
  authenticate,
  requirePermission('orders.read_own'),
  validateQuery(paginationQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as { page: number; limit: number };
    const result = await listOwnOrders(req.user!.id, query.page, query.limit);
    return sendSuccess(res, result, 'Orders retrieved successfully');
  }),
);

orderRouter.get(
  '/',
  authenticate,
  requirePermission('orders.read_all'),
  validateQuery(listOrdersQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as { page: number; limit: number };
    const result = await listAllOrders(query.page, query.limit);
    return sendSuccess(res, result, 'Orders retrieved successfully');
  }),
);

orderRouter.get(
  '/:orderId',
  authenticate,
  validateParams(orderIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await getOrder(req.user!, req.params.orderId!);
    return sendSuccess(res, order, 'Order retrieved successfully');
  }),
);

orderRouter.post(
  '/:orderId/cancel',
  authenticate,
  validateParams(orderIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await cancelOrder(req.user!, req.params.orderId!);
    return sendSuccess(res, order, 'Order cancelled');
  }),
);

announcementRouter.get(
  '/',
  validateQuery(listAnnouncementsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await listPublished(req.query as unknown as ListAnnouncementsQuery);
    return sendSuccess(res, result, 'Announcements retrieved successfully');
  }),
);

announcementRouter.get(
  '/manage',
  authenticate,
  requireAnyPermission('announcements.create', 'announcements.publish'),
  validateQuery(listAnnouncementsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await listManaged(req.user!, req.query as unknown as ListAnnouncementsQuery);
    return sendSuccess(res, result, 'Announcements retrieved successfully');
  }),
);

announcementRouter.post(
  '/',
  authenticate,
  requirePermission('announcements.create'),
  validateBody(createAnnouncementSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const announcement = await createAnnouncement(req.user!, req.body as CreateAnnouncementInput);
    return sendSuccess(res, announcement, 'Announcement drafted', 201);
  }),
);

announcementRouter.get(
  '/:announcementId',
  optionalAuthenticate,
  validateParams(announcementIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const announcement = await getAnnouncement(req.params.announcementId!, req.user);
    return sendSuccess(res, announcement, 'Announcement retrieved successfully');
  }),
);

announcementRouter.patch(
  '/:announcementId',
  authenticate,
  requirePermission('announcements.create'),
  validateParams(announcementIdParamSchema),
  validateBody(updateAnnouncementSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const announcement = await updateAnnouncement(
      req.user!,
      req.params.announcementId!,
      req.body as UpdateAnnouncementInput,
    );
    return sendSuccess(res, announcement, 'Announcement updated');
  }),
);

announcementRouter.post(
  '/:announcementId/publish',
  authenticate,
  requirePermission('announcements.publish'),
  validateParams(announcementIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const announcement = await setPublished(req.user!, req.params.announcementId!, true);
    return sendSuccess(res, announcement, 'Announcement published');
  }),
);

announcementRouter.post(
  '/:announcementId/unpublish',
  authenticate,
  requirePermission('announcements.publish'),
  validateParams(announcementIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const announcement = await setPublished(req.user!, req.params.announcementId!, false);
    return sendSuccess(res, announcement, 'Announcement unpublished');
  }),
);
