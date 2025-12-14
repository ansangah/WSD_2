import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { commonErrorResponses, registry, errorResponseSchema } from "@config/swagger";
import { authenticate } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { successResponse } from "@utils/api-response";
import {
  addWishlistSchema,
  wishlistCreatedSchema,
  wishlistItemSchema,
  wishlistListResponseSchema
} from "./wishlists.schemas";
import {
  addToWishlist,
  listWishlist,
  removeFromWishlist
} from "./wishlists.service";

const router = Router();

registry.registerPath({
  method: "post",
  path: "/wishlists",
  tags: ["Wishlists"],
  summary: "Add book to wishlist",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: addWishlistSchema
        }
      }
    }
  },
  responses: {
    ...commonErrorResponses(),
    201: {
      description: "Added",
      content: {
        "application/json": {
          schema: wishlistCreatedSchema
        }
      }
    },
    409: {
      description: "Already exists",
      content: {
        "application/json": {
          schema: errorResponseSchema
        }
      }
    }
  }
});

router.post(
  "/",
  authenticate,
  validate({ body: addWishlistSchema }),
  async (req, res) => {
    const item = await addToWishlist(req.user!.sub, req.body.bookId);
    return successResponse(res, {
      status: StatusCodes.CREATED,
      message: "위시리스트에 추가되었습니다.",
      payload: {
        wishlistId: item.id,
        bookId: item.bookId,
        createdAt: item.createdAt.toISOString()
      }
    });
  }
);

registry.registerPath({
  method: "get",
  path: "/wishlists",
  tags: ["Wishlists"],
  summary: "List wishlist items",
  security: [{ bearerAuth: [] }],
  responses: {
    ...commonErrorResponses(),
    200: {
      description: "Wishlist",
      content: {
        "application/json": {
          schema: wishlistListResponseSchema
        }
      }
    }
  }
});

router.get("/", authenticate, async (req, res) => {
  const items = await listWishlist(req.user!.sub);
  return successResponse(res, {
    message: "ok",
    payload: { items }
  });
});

registry.registerPath({
  method: "delete",
  path: "/wishlists/{bookId}",
  tags: ["Wishlists"],
  summary: "Remove item from wishlist",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "bookId", in: "path", required: true, schema: { type: "string" } }
  ],
  responses: {
    ...commonErrorResponses(),
    204: { description: "Removed" }
  }
});

router.delete("/:bookId", authenticate, async (req, res) => {
  await removeFromWishlist(req.user!.sub, req.params.bookId);
  return res.status(StatusCodes.NO_CONTENT).send();
});

export const wishlistsRouter = router;
