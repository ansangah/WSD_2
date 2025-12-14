import { Router } from "express";
import { commonErrorResponses, registry } from "@config/swagger";
import { authenticate } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { successResponse } from "@utils/api-response";
import {
  cartResponseSchema,
  modifyCartItemSchema,
  updateCartQuantitySchema
} from "./carts.schemas";
import {
  getMyCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from "./carts.service";

const router = Router();

registry.registerPath({
  method: "get",
  path: "/carts/me",
  tags: ["Carts"],
  summary: "사용자 장바구니 조회",
  security: [{ bearerAuth: [] }],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Cart",
      content: {
        "application/json": {
          schema: cartResponseSchema
        }
      }
    }
  }
});

router.get("/me", authenticate, async (req, res) => {
  const cart = await getMyCart(req.user!.sub);
  return successResponse(res, { message: "ok", payload: cart });
});

registry.registerPath({
  method: "post",
  path: "/carts/me/items",
  tags: ["Carts"],
  summary: "장바구니에 항목 추가",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: modifyCartItemSchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Updated cart",
      content: {
        "application/json": {
          schema: cartResponseSchema
        }
      }
    }
  }
});

router.post(
  "/me/items",
  authenticate,
  validate({ body: modifyCartItemSchema }),
  async (req, res) => {
    const cart = await addCartItem(
      req.user!.sub,
      req.body.bookId,
      req.body.quantity
    );
    return successResponse(res, {
      message: "장바구니가 업데이트되었습니다.",
      payload: cart
    });
  }
);

registry.registerPath({
  method: "patch",
  path: "/carts/me/items/{itemId}",
  tags: ["Carts"],
  summary: "장바구니 수량 수정",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "itemId", in: "path", required: true, schema: { type: "string" } }
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateCartQuantitySchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Updated cart",
      content: {
        "application/json": {
          schema: cartResponseSchema
        }
      }
    }
  }
});

router.patch(
  "/me/items/:itemId",
  authenticate,
  validate({ body: updateCartQuantitySchema }),
  async (req, res) => {
    const cart = await updateCartItemQuantity(
      req.user!.sub,
      req.params.itemId,
      req.body.quantity
    );
    return successResponse(res, {
      message: "수량이 변경되었습니다.",
      payload: cart
    });
  }
);

registry.registerPath({
  method: "delete",
  path: "/carts/me/items/{itemId}",
  tags: ["Carts"],
  summary: "장바구니 항목 제거",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "itemId", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Updated cart",
      content: {
        "application/json": {
          schema: cartResponseSchema
        }
      }
    }
  }
});

router.delete("/me/items/:itemId", authenticate, async (req, res) => {
  const cart = await removeCartItem(req.user!.sub, req.params.itemId);
  return successResponse(res, {
    message: "항목이 삭제되었습니다.",
    payload: cart
  });
});

registry.registerPath({
  method: "delete",
  path: "/carts/me",
  tags: ["Carts"],
  summary: "장바구니 비우기",
  security: [{ bearerAuth: [] }],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Cleared cart",
      content: {
        "application/json": {
          schema: cartResponseSchema
        }
      }
    }
  }
});

router.delete("/me", authenticate, async (req, res) => {
  const cart = await clearCart(req.user!.sub);
  return successResponse(res, {
    message: "장바구니가 비워졌습니다.",
    payload: cart
  });
});

export const cartsRouter = router;
