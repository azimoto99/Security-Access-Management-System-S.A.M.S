import api from './api';

export interface HRDocument {
  id: string;
  title: string;
  description?: string;
  document_type: 'onboarding' | 'policy' | 'contract' | 'other';
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_required: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  created_by_username?: string;
}

export interface DocumentAssignment {
  id: string;
  document_id: string;
  employee_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'declined' | 'expired';
  completed_at?: string;
  document_title?: string;
  employee_username?: string;
  assigned_by_username?: string;
}

export interface CreateAssignmentData {
  document_id: string;
  employee_id: string;
  due_date?: string;
}

export interface BulkAssignmentData {
  document_id: string;
  employee_ids: string[];
  due_date?: string;
}

export const hrDocumentService = {
  /**
   * Get all HR documents
   */
  getAllDocuments: async (activeOnly?: boolean): Promise<HRDocument[]> => {
    const params = activeOnly ? { active_only: 'true' } : {};
    const response = await api.get<{ success: boolean; data: { documents: HRDocument[] } }>(
      '/hr/documents',
      { params }
    );
    return response.data.data.documents;
  },

  /**
   * Get HR document by ID
   */
  getDocumentById: async (id: string): Promise<HRDocument> => {
    const response = await api.get<{ success: boolean; data: { document: HRDocument } }>(
      `/hr/documents/${id}`
    );
    return response.data.data.document;
  },

  /**
   * Download document
   */
  downloadDocument: async (id: string): Promise<Blob> => {
    const response = await api.get(`/hr/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Create HR document
   */
  createDocument: async (formData: FormData): Promise<HRDocument> => {
    const response = await api.post<{ success: boolean; data: { document: HRDocument } }>(
      '/hr/documents',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data.document;
  },

  /**
   * Update HR document
   */
  updateDocument: async (id: string, data: Partial<HRDocument>): Promise<HRDocument> => {
    const response = await api.put<{ success: boolean; data: { document: HRDocument } }>(
      `/hr/documents/${id}`,
      data
    );
    return response.data.data.document;
  },

  /**
   * Delete HR document
   */
  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/hr/documents/${id}`);
  },

  /**
   * Get employee assignments
   */
  getEmployeeAssignments: async (employeeId?: string): Promise<DocumentAssignment[]> => {
    const params = employeeId ? { employee_id: employeeId } : {};
    const response = await api.get<{ success: boolean; data: { assignments: DocumentAssignment[] } }>(
      '/hr/assignments/employee',
      { params }
    );
    return response.data.data.assignments;
  },

  /**
   * Get all assignments
   */
  getAllAssignments: async (filters?: {
    document_id?: string;
    employee_id?: string;
    status?: string;
  }): Promise<DocumentAssignment[]> => {
    const response = await api.get<{ success: boolean; data: { assignments: DocumentAssignment[] } }>(
      '/hr/assignments',
      { params: filters }
    );
    return response.data.data.assignments;
  },

  /**
   * Get assignment by ID
   */
  getAssignmentById: async (id: string): Promise<DocumentAssignment> => {
    const response = await api.get<{ success: boolean; data: { assignment: DocumentAssignment } }>(
      `/hr/assignments/${id}`
    );
    return response.data.data.assignment;
  },

  /**
   * Create assignment
   */
  createAssignment: async (data: CreateAssignmentData): Promise<DocumentAssignment> => {
    const response = await api.post<{ success: boolean; data: { assignment: DocumentAssignment } }>(
      '/hr/assignments',
      data
    );
    return response.data.data.assignment;
  },

  /**
   * Create bulk assignments
   */
  createBulkAssignments: async (data: BulkAssignmentData): Promise<DocumentAssignment[]> => {
    const response = await api.post<{ success: boolean; data: { assignments: DocumentAssignment[] } }>(
      '/hr/assignments/bulk',
      data
    );
    return response.data.data.assignments;
  },

  /**
   * Initiate document signing
   */
  initiateSigning: async (assignmentId: string): Promise<{ envelope_id: string; signing_url: string }> => {
    const response = await api.post<{ success: boolean; data: { envelope_id: string; signing_url: string } }>(
      '/hr/docusign/initiate',
      { assignment_id: assignmentId }
    );
    return response.data.data;
  },

  /**
   * Get signing status
   */
  getSigningStatus: async (assignmentId: string): Promise<any> => {
    const response = await api.get<{ success: boolean; data: { signature: any } }>(
      '/hr/docusign/status',
      { params: { assignment_id: assignmentId } }
    );
    return response.data.data.signature;
  },
};















