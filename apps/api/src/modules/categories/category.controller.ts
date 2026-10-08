import { Request, Response, NextFunction } from "express";
import * as CategoryService from "./category.service";
import { sendSuccess } from "../../utils/response";

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await CategoryService.listCategories();
    sendSuccess({ res, data: categories });
  } catch (err) { next(err); }
}

export async function getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await CategoryService.getCategoryBySlug(req.params.slug);
    sendSuccess({ res, data: category });
  } catch (err) { next(err); }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await CategoryService.createCategory(req.body);
    sendSuccess({ res, data: category, statusCode: 201 });
  } catch (err) { next(err); }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await CategoryService.updateCategory(req.params.id, req.body);
    sendSuccess({ res, data: category });
  } catch (err) { next(err); }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await CategoryService.deleteCategory(req.params.id);
    sendSuccess({ res, data: null, message: "Category deactivated." });
  } catch (err) { next(err); }
}
