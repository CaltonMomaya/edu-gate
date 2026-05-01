/**
 * @swagger
 * /api/students:
 *   get:
 *     tags: [Students]
 *     summary: Get all students
 *     description: Retrieves a list of all students for the authenticated school
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       admission_number:
 *                         type: string
 *                       grade:
 *                         type: string
 *                       stream:
 *                         type: string
 *       401:
 *         description: Unauthorized
 * 
 *   post:
 *     tags: [Students]
 *     summary: Create a new student
 *     description: Creates a new student record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - admission_number
 *               - grade
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               admission_number:
 *                 type: string
 *               grade:
 *                 type: string
 *               stream:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

// ... rest of your API implementation
