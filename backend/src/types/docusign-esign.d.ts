declare module 'docusign-esign' {
  export class ApiClient {
    setBasePath(basePath: string): void;
    addDefaultHeader(headerName: string, headerValue: string): void;
    requestJWTUserToken(
      clientId: string,
      userId: string,
      scopes: string,
      privateKey: string,
      expiresIn: number
    ): Promise<{ body: { access_token: string } }>;
  }

  export namespace Api {
    export class EnvelopesApi {
      constructor(apiClient?: ApiClient);
      createEnvelope(accountId: string, envelope?: any, options?: any): Promise<any>;
      createRecipientView(accountId: string, envelopeId: string, recipientViewRequest?: any, options?: any): Promise<any>;
      getEnvelope(accountId: string, envelopeId: string, options?: any): Promise<any>;
    }

    export class AuthenticationApi {
      constructor(apiClient?: ApiClient);
      login(loginInformation?: any, options?: any): Promise<any>;
    }
  }

  export class EnvelopeDefinition {
    documents?: any[];
    recipients?: any;
    emailSubject?: string;
    status?: string;
  }

  export class Signer {
    email?: string;
    name?: string;
    recipientId?: string;
    routingOrder?: string;
    tabs?: Tabs;
  }

  export class Document {
    documentBase64?: string;
    name?: string;
    fileExtension?: string;
    documentId?: string;
  }

  export class SignHere {
    documentId?: string;
    pageNumber?: string;
    recipientId?: string;
    tabLabel?: string;
    xPosition?: string;
    yPosition?: string;
  }

  export class DateSigned {
    documentId?: string;
    pageNumber?: string;
    recipientId?: string;
    xPosition?: string;
    yPosition?: string;
  }

  export class Tabs {
    signHereTabs?: SignHere[];
    dateSignedTabs?: DateSigned[];
  }

  export class Recipients {
    signers?: Signer[];
  }

  export class RecipientViewRequest {
    authenticationMethod?: string;
    email?: string;
    userName?: string;
    recipientId?: string;
    clientUserId?: string;
    returnUrl?: string;
  }

  interface DocusignModule {
    ApiClient: typeof ApiClient;
    Api: typeof Api;
    EnvelopeDefinition: typeof EnvelopeDefinition;
    Signer: typeof Signer;
    Document: typeof Document;
    SignHere: typeof SignHere;
    DateSigned: typeof DateSigned;
    Tabs: typeof Tabs;
    Recipients: typeof Recipients;
    RecipientViewRequest: typeof RecipientViewRequest;
  }

  const docusign: DocusignModule;
  export default docusign;
}

