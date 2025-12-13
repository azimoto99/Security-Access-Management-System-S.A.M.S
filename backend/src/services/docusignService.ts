import docusign from 'docusign-esign';
import { config } from '../utils/env';
import { logger } from '../utils/logger';
import pool from '../config/database';
import path from 'path';
import fs from 'fs/promises';
import { updateAssignmentStatus, checkOnboardingStatus } from './documentAssignmentService';
import { createAlert } from './alertService';

let apiClient: docusign.ApiClient | null = null;

/**
 * Initialize DocuSign API client
 */
export const initializeDocuSignClient = async (): Promise<docusign.ApiClient> => {
  if (apiClient) {
    return apiClient;
  }

  if (!config.docusign.integrationKey || !config.docusign.userId || !config.docusign.accountId) {
    throw new Error('DocuSign configuration is incomplete');
  }

  apiClient = new docusign.ApiClient();
  apiClient.setBasePath(config.docusign.apiBasePath);

  // JWT authentication
  try {
    const jwtLifeSec = 3600; // 1 hour
    const results = await apiClient.requestJWTUserToken(
      config.docusign.integrationKey!,
      config.docusign.userId!,
      'signature impersonation',
      config.docusign.rsaPrivateKey || '',
      jwtLifeSec
    );

    apiClient.addDefaultHeader('Authorization', `Bearer ${results.body.access_token}`);
    logger.info('DocuSign API client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize DocuSign API client:', error);
    throw error;
  }

  return apiClient;
};

/**
 * Create DocuSign envelope for document signing
 */
export const createEnvelope = async (
  assignmentId: string,
  documentPath: string,
  signerEmail: string,
  signerName: string,
  returnUrl: string
): Promise<{ envelopeId: string; signingUrl: string }> => {
  try {
    const client = await initializeDocuSignClient();
    const envelopesApi = new docusign.EnvelopesApi(client);

    // Read document file
    const fullPath = path.join(process.cwd(), documentPath);
    const documentBytes = await fs.readFile(fullPath);
    const base64Document = Buffer.from(documentBytes).toString('base64');

    // Get file name
    const fileName = path.basename(documentPath);

    // Create document
    const document = new docusign.Document();
    document.documentBase64 = base64Document;
    document.name = fileName;
    document.fileExtension = path.extname(fileName).substring(1);
    document.documentId = '1';

    // Create signer
    const signer = new docusign.Signer();
    signer.email = signerEmail;
    signer.name = signerName;
    signer.recipientId = '1';
    signer.routingOrder = '1';

    // Create sign here tab
    const signHere = new docusign.SignHere();
    signHere.documentId = '1';
    signHere.pageNumber = '1';
    signHere.recipientId = '1';
    signHere.tabLabel = 'SignHereTab';
    signHere.xPosition = '195';
    signHere.yPosition = '147';

    // Create date signed tab
    const dateSigned = new docusign.DateSigned();
    dateSigned.documentId = '1';
    dateSigned.pageNumber = '1';
    dateSigned.recipientId = '1';
    dateSigned.xPosition = '195';
    dateSigned.yPosition = '200';

    signer.tabs = new docusign.Tabs();
    signer.tabs.signHereTabs = [signHere];
    signer.tabs.dateSignedTabs = [dateSigned];

    // Create recipient
    const recipients = new docusign.Recipients();
    recipients.signers = [signer];

    // Create envelope
    const envelope = new docusign.EnvelopeDefinition();
    envelope.emailSubject = 'Please sign this document';
    envelope.documents = [document];
    envelope.recipients = recipients;
    envelope.status = 'sent';

    // Create envelope
    const results = await envelopesApi.createEnvelope(config.docusign.accountId!, {
      envelopeDefinition: envelope,
    });

    const envelopeId = results.envelopeId!;

    // Create recipient view (signing URL)
    const viewRequest = new docusign.RecipientViewRequest();
    viewRequest.returnUrl = returnUrl;
    viewRequest.authenticationMethod = 'none';
    viewRequest.email = signerEmail;
    viewRequest.userName = signerName;
    viewRequest.recipientId = '1';

    const viewResults = await envelopesApi.createRecipientView(
      config.docusign.accountId!,
      envelopeId,
      {
        recipientViewRequest: viewRequest,
      }
    );

    const signingUrl = viewResults.url!;

    // Save signature record
    await pool.query(
      `INSERT INTO document_signatures (assignment_id, docusign_envelope_id, docusign_envelope_status, signing_url, signer_email, signer_name)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [assignmentId, envelopeId, 'sent', signingUrl, signerEmail, signerName]
    );

    // Update assignment status
    await updateAssignmentStatus(assignmentId, 'in_progress');

    logger.info(`DocuSign envelope created: ${envelopeId} for assignment ${assignmentId}`);

    return { envelopeId, signingUrl };
  } catch (error) {
    logger.error('Error creating DocuSign envelope:', error);
    throw error;
  }
};

/**
 * Get envelope status
 */
export const getEnvelopeStatus = async (envelopeId: string): Promise<string> => {
  try {
    const client = await initializeDocuSignClient();
    const envelopesApi = new docusign.EnvelopesApi(client);

    const results = await envelopesApi.getEnvelope(config.docusign.accountId!, envelopeId);
    return results.status || 'unknown';
  } catch (error) {
    logger.error('Error getting envelope status:', error);
    throw error;
  }
};

/**
 * Process webhook event
 */
export const processWebhookEvent = async (eventData: any): Promise<void> => {
  try {
    const envelopeId = eventData.data?.envelopeId || eventData.envelopeId;
    const eventType = eventData.event || eventData.eventType;

    if (!envelopeId) {
      logger.warn('Webhook event missing envelope ID');
      return;
    }

    // Save webhook event
    await pool.query(
      `INSERT INTO docusign_webhook_events (envelope_id, event_type, event_data, processed)
       VALUES ($1, $2, $3, false)`,
      [envelopeId, eventType, JSON.stringify(eventData)]
    );

    // Get signature record
    const signatureResult = await pool.query(
      'SELECT * FROM document_signatures WHERE docusign_envelope_id = $1',
      [envelopeId]
    );

    if (signatureResult.rows.length === 0) {
      logger.warn(`No signature record found for envelope ${envelopeId}`);
      return;
    }

    const signature = signatureResult.rows[0];

    // Process based on event type
    if (eventType === 'envelope-completed' || eventType === 'envelope-signed') {
      // Update signature record
      await pool.query(
        `UPDATE document_signatures
         SET docusign_envelope_status = 'completed',
             signed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [signature.id]
      );

      // Update assignment status
      await updateAssignmentStatus(signature.assignment_id, 'completed', new Date());

      // Check onboarding status
      const assignmentResult = await pool.query(
        'SELECT employee_id FROM document_assignments WHERE id = $1',
        [signature.assignment_id]
      );
      if (assignmentResult.rows.length > 0) {
        await checkOnboardingStatus(assignmentResult.rows[0].employee_id);
      }

      logger.info(`Document signed: envelope ${envelopeId}, assignment ${signature.assignment_id}`);
    } else if (eventType === 'envelope-declined') {
      // Update signature record
      await pool.query(
        `UPDATE document_signatures
         SET docusign_envelope_status = 'declined',
             declined_at = CURRENT_TIMESTAMP,
             declined_reason = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [eventData.data?.reason || 'Declined by signer', signature.id]
      );

      // Update assignment status
      await updateAssignmentStatus(signature.assignment_id, 'declined');

      // Create alert for administrators
      const assignmentResult = await pool.query(
        `SELECT a.*, d.title as document_title, u.username as employee_username
         FROM document_assignments a
         JOIN hr_documents d ON a.document_id = d.id
         JOIN users u ON a.employee_id = u.id
         WHERE a.id = $1`,
        [signature.assignment_id]
      );

      if (assignmentResult.rows.length > 0) {
        const assignment = assignmentResult.rows[0];
        await createAlert({
          type: 'watchlist_match', // Reusing alert type for HR notifications
          severity: 'medium',
          title: 'Document Signing Declined',
          message: `Employee ${assignment.employee_username} declined to sign document "${assignment.document_title}"`,
          metadata: {
            assignment_id: signature.assignment_id,
            envelope_id: envelopeId,
            employee_id: assignment.employee_id,
          },
        });
      }

      logger.warn(`Document declined: envelope ${envelopeId}, assignment ${signature.assignment_id}`);
    } else if (eventType === 'envelope-voided') {
      // Update signature record
      await pool.query(
        `UPDATE document_signatures
         SET docusign_envelope_status = 'voided',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [signature.id]
      );

      logger.info(`Envelope voided: ${envelopeId}`);
    }

    // Mark webhook event as processed
    await pool.query(
      'UPDATE docusign_webhook_events SET processed = true, processed_at = CURRENT_TIMESTAMP WHERE envelope_id = $1 AND event_type = $2',
      [envelopeId, eventType]
    );
  } catch (error) {
    logger.error('Error processing webhook event:', error);
    throw error;
  }
};


