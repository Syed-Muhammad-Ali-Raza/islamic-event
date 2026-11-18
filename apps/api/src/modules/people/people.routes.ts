import { Router } from "express";
import * as PeopleController from "./people.controller";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", PeopleController.listPeople);
router.get("/:id", PeopleController.getPerson);
router.post("/", requireAuth, requireSuperAdmin, PeopleController.createPerson);
router.patch("/:id", requireAuth, requireSuperAdmin, PeopleController.updatePerson);

export default router;
