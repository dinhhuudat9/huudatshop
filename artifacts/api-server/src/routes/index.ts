import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import postsRouter from "./posts";
import statsRouter from "./stats";
import usersRouter from "./users";
import balanceRequestsRouter from "./balance-requests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(postsRouter);
router.use(statsRouter);
router.use(usersRouter);
router.use(balanceRequestsRouter);

export default router;
