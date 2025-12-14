import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { commonErrorResponses, registry, errorResponseSchema } from "@config/swagger";
import { authenticate, requireRoles } from "@middleware/auth";
import { validate } from "@middleware/validate";
import {
  createOrderSchema,
  orderResponseSchema,
  paginatedOrdersSchema,
  orderQuerySchema,
  orderStatusEnum
} from "./orders.schemas";
import {
  createOrder,
  listOrders,
  getOrderById,
  listMyOrders,
  updateOrderStatus,
  cancelOrder
} from "./orders.service";
import { ApiError, ERROR_CODES } from "@core/errors";
import { successResponse } from "@utils/api-response";

const router = Router();

registry.registerPath({
  method: "post",
  path: "/orders",
  tags: ["Orders"],
  summary: "주문 생성",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createOrderSchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    201: {
      description: "Order created",
      content: {
        "application/json": {
          schema: orderResponseSchema
        }
      }
    }
  }
});

router.post(
  "/",
  authenticate,
  validate({ body: createOrderSchema }),
  async (req, res) => {
    const order = await createOrder(req.user!.sub, req.body);
    return successResponse(res, {
      status: StatusCodes.CREATED,
      message: "주문이 정상적으로 생성되었습니다.",
      payload: {
        orderId: order.id,
        createdAt: order.createdAt.toISOString()
      }
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/orders",
  tags: ["Orders"],
  summary: "주문 목록 조회(관리자)",
  security: [{ bearerAuth: [] }],
  request: {
    query: orderQuerySchema
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Paginated orders",
      content: {
        "application/json": {
          schema: paginatedOrdersSchema
        }
      }
    }
  }
});

router.get(
  "/",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ query: orderQuerySchema }),
  async (req, res) => {
    const orders = await listOrders(req.query as Record<string, string>);
    return successResponse(res, {
      message: "ok",
      payload: orders
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/orders/mine",
  tags: ["Orders"],
  summary: "현재 사용자 주문 목록",
  security: [{ bearerAuth: [] }],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Orders of current user",
      content: {
        "application/json": {
          schema: z.array(orderResponseSchema)
        }
      }
    }
  }
});

router.get("/mine", authenticate, async (req, res) => {
  const orders = await listMyOrders(req.user!.sub);
  return successResponse(res, { message: "ok", payload: orders });
});

registry.registerPath({
  method: "get",
  path: "/orders/{id}",
  tags: ["Orders"],
  summary: "주문 상세 조회",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Order detail",
      content: {
        "application/json": {
          schema: orderResponseSchema
        }
      }
    }
  }
});

router.get("/:id", authenticate, async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (order.userId !== req.user!.sub && req.user!.role === "USER") {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Cannot view this order", {
      status: StatusCodes.FORBIDDEN
    });
  }
  return successResponse(res, { message: "ok", payload: order });
});

registry.registerPath({
  method: "patch",
  path: "/orders/{id}/status",
  tags: ["Orders"],
  summary: "주문 상태 업데이트",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: orderStatusEnum
          })
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Updated order",
      content: {
        "application/json": {
          schema: orderResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/:id/status",
  authenticate,
  requireRoles("ADMIN", "CURATOR"),
  validate({ body: z.object({ status: orderStatusEnum }) }),
  async (req, res) => {
    const order = await updateOrderStatus(req.params.id, req.body.status);
    return successResponse(res, {
      message: "주문 상태가 업데이트되었습니다.",
      payload: order
    });
  }
);

registry.registerPath({
  method: "delete",
  path: "/orders/{id}",
  tags: ["Orders"],
  summary: "주문 취소(고객)",
  security: [{ bearerAuth: [] }],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Cancelled order",
      content: {
        "application/json": {
          schema: orderResponseSchema
        }
      }
    }
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  const order = await cancelOrder(req.params.id, req.user!.sub);
  return successResponse(res, {
    message: "주문이 취소되었습니다.",
    payload: order
  });
});

registry.registerPath({
  method: "get",
  path: "/orders/{id}/items",
  tags: ["Orders"],
  summary: "주문 항목",
  security: [{ bearerAuth: [] }],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Items",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              quantity: z.number(),
              unitPrice: z.string(),
              subtotal: z.string(),
              book: z.object({
                id: z.string(),
                title: z.string()
              })
            })
          )
        }
      }
    }
  }
});

router.get("/:id/items", authenticate, async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (order.userId !== req.user!.sub && req.user!.role === "USER") {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Cannot view items", {
      status: StatusCodes.FORBIDDEN
    });
  }
  return successResponse(res, {
    message: "ok",
    payload: order.items
  });
});

export const ordersRouter = router;
