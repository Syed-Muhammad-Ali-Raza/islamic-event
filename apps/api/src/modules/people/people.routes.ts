import { Router } from "express";
import * as PeopleController from "./people.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", PeopleController.listPeople);
router.get("/:id", PeopleController.getPerson);
router.post("/", requireAuth, PeopleController.createPerson);
router.patch("/:id", requireAuth, PeopleController.updatePerson);

export default router;
