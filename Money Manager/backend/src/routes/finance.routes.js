import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as finance from '../services/finance.service.js'

const router = Router()

router.use(requireAuth)

/** GET /api/finance — full app state (same shape as frontend financeStore) */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const state = await finance.loadFinanceState(req.user.id)
    res.json(state)
  }),
)

router.post(
  '/books',
  asyncHandler(async (req, res) => {
    const book = await finance.addBook(req.user.id, req.body.name, req.body.clientId)
    res.status(201).json(book)
  }),
)

router.patch(
  '/books/default',
  asyncHandler(async (req, res) => {
    await finance.setDefaultBook(req.user.id, req.body.bookId)
    res.json({ ok: true })
  }),
)

router.post(
  '/accounts',
  asyncHandler(async (req, res) => {
    const account = await finance.addAccount(req.user.id, req.body)
    res.status(201).json(account)
  }),
)

router.patch(
  '/accounts/:id',
  asyncHandler(async (req, res) => {
    await finance.updateAccount(req.user.id, req.params.id, req.body)
    res.json({ ok: true })
  }),
)

router.post(
  '/transactions',
  asyncHandler(async (req, res) => {
    const tx = await finance.addLedgerTransaction(req.user.id, {
      bookId: req.body.bookId,
      accountId: req.body.accountId,
      entryType: req.body.entryType || req.body.type,
      amount: req.body.amount,
      categoryId: req.body.categoryId,
      note: req.body.note,
    })
    res.status(201).json(tx)
  }),
)

router.delete(
  '/transactions/:id',
  asyncHandler(async (req, res) => {
    await finance.deleteTransaction(req.user.id, req.params.id)
    res.json({ ok: true })
  }),
)

router.post(
  '/transfers',
  asyncHandler(async (req, res) => {
    const tx = await finance.transfer(req.user.id, req.body)
    res.status(201).json(tx)
  }),
)

router.post(
  '/topups',
  asyncHandler(async (req, res) => {
    const tx = await finance.topUp(req.user.id, req.body)
    res.status(201).json(tx)
  }),
)

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    await finance.updateSettings(req.user.id, req.body)
    res.json({ ok: true })
  }),
)

router.delete(
  '/books/:id',
  asyncHandler(async (req, res) => {
    await finance.deleteBook(req.user.id, req.params.id)
    res.json({ ok: true })
  }),
)

router.post(
  '/budget-plans',
  asyncHandler(async (req, res) => {
    const plan = await finance.saveBudgetPlan(req.user.id, req.body)
    res.status(201).json(plan)
  }),
)

router.delete(
  '/budget-plans/:id',
  asyncHandler(async (req, res) => {
    await finance.deleteBudgetPlan(req.user.id, req.params.id)
    res.json({ ok: true })
  }),
)

router.post(
  '/feedbacks',
  asyncHandler(async (req, res) => {
    const fb = await finance.addFeedback(req.user.id, req.body)
    res.status(201).json(fb)
  }),
)

router.post(
  '/ratings',
  asyncHandler(async (req, res) => {
    const rt = await finance.addRating(req.user.id, req.body)
    res.status(201).json(rt)
  }),
)

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const cat = await finance.addCategory(req.user.id, req.body)
    res.status(201).json(cat)
  }),
)

router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    await finance.deleteCategory(req.user.id, req.params.id)
    res.json({ ok: true })
  }),
)

router.delete(
  '/reset',
  asyncHandler(async (req, res) => {
    await finance.resetUserData(req.user.id)
    res.json({ ok: true })
  }),
)

export default router
