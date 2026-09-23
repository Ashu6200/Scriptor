import { logger } from "@infra/logger";
import { AppError } from "./errors";
import type { PaginatedResult, PaginationParams } from "./types/common";

interface PaginateFindManyArgs {
  skip: number;
  take: number;
  orderBy: unknown;
  where?: unknown;
  include?: unknown;
  select?: unknown;
}

interface PaginableDelegate<TRecord> {
  findMany(args: PaginateFindManyArgs): Promise<TRecord[]>;
  count(args: { where?: unknown }): Promise<number>;
}

export abstract class BaseService {
  protected handleError(error: unknown, defaultMessage = "An error occurred"): never {
    if (error instanceof AppError) {
      throw error;
    }
    const err = error as { code?: string; name?: string };
    if (
      (typeof err?.code === "string" && err.code.startsWith("P")) ||
      err?.name === "ZodError" ||
      err?.name?.startsWith("PrismaClient")
    ) {
      throw error;
    }
    logger.error("Unexpected error in service:", error);
    throw new AppError(defaultMessage, 500);
  }

  protected async paginate<T>(
    model: unknown,
    pagination: PaginationParams,
    args: {
      where?: unknown;
      include?: unknown;
      select?: unknown;
      orderBy?: unknown;
    } = {}
  ): Promise<PaginatedResult<T>> {
    const delegate = model as PaginableDelegate<T>;

    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const orderBy =
      args.orderBy || (sortBy ? { [sortBy]: sortOrder || "desc" } : { createdAt: "desc" as const });

    const [data, total] = await Promise.all([
      delegate.findMany({
        skip,
        take: limit,
        orderBy,
        where: args.where,
        ...(args.include ? { include: args.include } : {}),
        ...(args.select ? { select: args.select } : {}),
      }),
      delegate.count({ where: args.where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }
}
