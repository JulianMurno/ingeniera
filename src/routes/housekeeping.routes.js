const { Router } = require('express');
const { requireAuth, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  resumenQuerySchema,
} = require('../schemas/housekeeping.schema');
const { idParamSchema } = require('../schemas/room.schema');
const { createTask, listTasks, updateTask, getResumen } = require('../controllers/housekeeping.controller');

const router = Router();

router.use(requireAuth);

router.post('/tasks', authorize('ADMINISTRADOR'), validate(createTaskSchema), createTask);
router.get('/tasks', validate(taskQuerySchema, 'query'), listTasks);
router.get('/resumen', validate(resumenQuerySchema, 'query'), getResumen);
router.patch('/tasks/:id', validate(idParamSchema, 'params'), validate(updateTaskSchema), updateTask);

module.exports = router;
