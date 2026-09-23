import prisma from '@/lib/db';

export type JobStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'WORKER_ON_THE_WAY'
  | 'ARRIVED'
  | 'WORK_STARTED'
  | 'WORK_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'REVIEWED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_WORKER'
  | 'EXPIRED'
  | 'DISPUTED';

export const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  REQUESTED: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED_BY_CUSTOMER'],
  ACCEPTED: [
    'SCHEDULED',
    'WORKER_ON_THE_WAY',
    'CANCELLED_BY_CUSTOMER',
    'CANCELLED_BY_WORKER',
    'DISPUTED',
  ],
  SCHEDULED: [
    'WORKER_ON_THE_WAY',
    'CANCELLED_BY_CUSTOMER',
    'CANCELLED_BY_WORKER',
    'DISPUTED',
  ],
  WORKER_ON_THE_WAY: [
    'ARRIVED',
    'CANCELLED_BY_CUSTOMER',
    'CANCELLED_BY_WORKER',
    'DISPUTED',
  ],
  ARRIVED: ['WORK_STARTED', 'CANCELLED_BY_CUSTOMER', 'DISPUTED'],
  WORK_STARTED: ['WORK_COMPLETED', 'DISPUTED'],
  WORK_COMPLETED: ['PAYMENT_PENDING', 'PAID', 'DISPUTED'],
  PAYMENT_PENDING: ['PAID', 'DISPUTED'],
  PAID: ['REVIEWED', 'COMPLETED', 'DISPUTED'],
  REVIEWED: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'],
  REJECTED: [],
  CANCELLED_BY_CUSTOMER: [],
  CANCELLED_BY_WORKER: [],
  EXPIRED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'PAYMENT_PENDING', 'PAID'],
};

export interface TransitionContext {
  jobId: string;
  toStatus: JobStatus;
  changedByUserId?: string;
  userRole: 'CUSTOMER' | 'WORKER' | 'BUSINESS' | 'ADMIN';
  note?: string;
  reason?: string;
}

export class JobStateMachine {
  /**
   * Validates whether a state transition is legal according to the marketplace state machine
   */
  static canTransition(fromStatus: JobStatus, toStatus: JobStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * Validates role permissions for initiating a state transition
   */
  static isRoleAuthorized(
    fromStatus: JobStatus,
    toStatus: JobStatus,
    role: 'CUSTOMER' | 'WORKER' | 'BUSINESS' | 'ADMIN'
  ): boolean {
    if (role === 'ADMIN') return true;

    if (role === 'WORKER') {
      const workerActions: JobStatus[] = [
        'ACCEPTED',
        'REJECTED',
        'WORKER_ON_THE_WAY',
        'ARRIVED',
        'WORK_STARTED',
        'WORK_COMPLETED',
        'CANCELLED_BY_WORKER',
        'DISPUTED',
      ];
      return workerActions.includes(toStatus);
    }

    if (role === 'CUSTOMER' || role === 'BUSINESS') {
      const customerActions: JobStatus[] = [
        'SCHEDULED',
        'CANCELLED_BY_CUSTOMER',
        'PAYMENT_PENDING',
        'PAID',
        'REVIEWED',
        'COMPLETED',
        'DISPUTED',
      ];
      return customerActions.includes(toStatus);
    }

    return false;
  }

  /**
   * Executes a verified, atomic state transition in the database
   */
  static async transition(context: TransitionContext) {
    const { jobId, toStatus, changedByUserId, userRole, note, reason } = context;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
        worker: true,
      },
    });

    if (!job) {
      throw new Error(`Job not found with ID: ${jobId}`);
    }

    const currentStatus = job.status as JobStatus;

    if (!this.canTransition(currentStatus, toStatus)) {
      throw new Error(
        `Invalid state transition: Cannot change job status from '${currentStatus}' to '${toStatus}'.`
      );
    }

    if (!this.isRoleAuthorized(currentStatus, toStatus, userRole)) {
      throw new Error(
        `Role '${userRole}' is not authorized to transition job from '${currentStatus}' to '${toStatus}'.`
      );
    }

    // Additional business logic validations
    const updateData: any = {
      status: toStatus,
    };

    if (toStatus === 'WORK_STARTED' && !job.actualStartTime) {
      updateData.actualStartTime = new Date();
    } else if (toStatus === 'WORK_COMPLETED' && !job.actualEndTime) {
      updateData.actualEndTime = new Date();
    } else if (toStatus === 'CANCELLED_BY_CUSTOMER' || toStatus === 'CANCELLED_BY_WORKER') {
      updateData.cancellationReason = reason || note || 'Cancelled by user';
      updateData.cancelInitiatedBy = userRole;
    } else if (toStatus === 'REJECTED') {
      updateData.rejectionReason = reason || note || 'Worker declined request';
    }

    // Run atomically with history entry
    const [updatedJob, historyEntry] = await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: updateData,
      }),
      prisma.jobStatusHistory.create({
        data: {
          jobId,
          fromStatus: currentStatus,
          toStatus,
          changedByUserId,
          note: note || (reason ? `Reason: ${reason}` : `Status changed to ${toStatus}`),
        },
      }),
    ]);

    return { job: updatedJob, history: historyEntry };
  }
}

export default JobStateMachine;
