import express from 'express';
import { createUser, viewUsers, viewUser, updateUser, deleteUser } from '../controller/userController.js';

const router = express.Router();

// list users
router.get('/', viewUsers);
// get user by id
router.get('/:id', viewUser);
// update user
router.put('/:id', updateUser);
// delete user
router.delete('/:id', deleteUser);
// create user
router.post('/', createUser);

export default router;
