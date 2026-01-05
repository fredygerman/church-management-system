export declare class RegisterStep4Dto {
    userId: string;
    businessName: string;
    businessRegistrationNumber: string;
}
export interface UploadedDocumentDto {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
}
