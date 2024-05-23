import { Op } from 'sequelize';
import { GetCasesQuery } from '@dmr.is/shared/dto';

type WhereClause = {
  applicationId?: string;
  year?: number;
  caseNumber?: number;
  assignedUserId?: string;
  statusId?: string;
  fastTrack?: boolean;
  departmentId?: string;
  publishedAt?: { [Op.not]: null } | { [Op.is]: null };
  createdAt?: {
    [Op.gte]?: string;
    [Op.lte]?: string;
  };
};

// Initialize the where clause object
const whereClause: WhereClause = {};

const caseParameters = (params: GetCasesQuery, caseStatusId?: string) => {
  // Check and add each parameter to the where clause
  if (params.applicationId !== undefined) {
    whereClause.applicationId = params.applicationId;
  }
  
  if (params.year !== undefined) {
    whereClause.year = params.year;
  }
  
  if (params.caseNumber !== undefined) {
    whereClause.caseNumber = params.caseNumber;
  }
  
  if (params.employeeId !== undefined) {
    whereClause.assignedUserId = params.employeeId;
  }
  
  if (caseStatusId) {
    whereClause.statusId = caseStatusId;
  }
  
  if (params.fastTrack !== undefined) {
    whereClause.fastTrack = params.fastTrack === 'true';
  }
  
  if (params.department !== undefined) {
    whereClause.departmentId = params.department;
  }
  
  if (params.published === 'true') {
    whereClause.publishedAt = { [Op.not]: null };
  } else if (params.published === 'false') {
    whereClause.publishedAt = { [Op.is]: null };
  }
  
  if (params?.fromDate || params?.toDate) {
    whereClause.createdAt = {
      ...(params?.fromDate && { [Op.gte]: params?.fromDate, }),
      ...(params?.toDate && { [Op.lte]: params?.toDate, }),
    };
  }

  // When no params were set we were stting the publishedAt as null. Keeping in for now.
  if (Object.keys(whereClause).length === 0) {
    return {
      publishedAt: null,
    }
  }

  return whereClause
}

export {
  caseParameters
}
