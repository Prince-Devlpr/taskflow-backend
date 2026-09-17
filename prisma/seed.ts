import { PrismaClient, Category, Priority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TaskFlow database seeding...');

  // Clean existing records
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Prince Sharma',
      email: 'prince@student.edu',
      passwordHash,
    },
  });

  console.log(`👤 Created demo student user: ${user.name} (${user.email})`);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const inFiveDays = new Date(today);
  inFiveDays.setDate(inFiveDays.getDate() + 5);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const sampleTasks = [
    {
      title: 'Finish Database Systems Assignment 3',
      description: 'Implement SQL queries, normalization to BCNF, and ER diagram indexing documentation.',
      category: Category.ASSIGNMENT,
      priority: Priority.HIGH,
      dueDate: today,
      completed: false,
      userId: user.id,
    },
    {
      title: 'Operating Systems Midterm Revision',
      description: 'Review CPU scheduling algorithms (Round Robin, SRTF), virtual memory, and semaphore synchronization problems.',
      category: Category.EXAM,
      priority: Priority.HIGH,
      dueDate: tomorrow,
      completed: false,
      userId: user.id,
    },
    {
      title: 'Full-Stack TaskFlow Project Milestone',
      description: 'Connect Flutter frontend with Express REST API and verify Prisma migrations on PostgreSQL.',
      category: Category.PROJECT,
      priority: Priority.HIGH,
      dueDate: dayAfterTomorrow,
      completed: false,
      userId: user.id,
    },
    {
      title: 'Data Structures Lab 5 - Binary Search Trees',
      description: 'Write C++ code for AVL tree rotation balancing and submit the lab report before midnight.',
      category: Category.LAB,
      priority: Priority.MEDIUM,
      dueDate: inFiveDays,
      completed: false,
      userId: user.id,
    },
    {
      title: 'Renew University Library Books',
      description: 'Extend loan period for Clean Architecture and Algorithms 4th Edition online.',
      category: Category.PERSONAL,
      priority: Priority.LOW,
      dueDate: tomorrow,
      completed: true,
      completedAt: yesterday,
      userId: user.id,
    },
    {
      title: 'Computer Networks Quiz 2',
      description: 'Subnetting calculations and TCP vs UDP handshake flow analysis.',
      category: Category.EXAM,
      priority: Priority.MEDIUM,
      dueDate: yesterday,
      completed: true,
      completedAt: yesterday,
      userId: user.id,
    },
    {
      title: 'Submit College Hackathon Registration Form',
      description: 'Form team with classmates and submit track proposal for AI/Productivity category.',
      category: Category.OTHER,
      priority: Priority.LOW,
      dueDate: inFiveDays,
      completed: false,
      userId: user.id,
    },
  ];

  for (const task of sampleTasks) {
    await prisma.task.create({ data: task });
  }

  console.log(`✅ Seeded ${sampleTasks.length} realistic academic tasks!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
