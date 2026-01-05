export declare enum PreferredLanguageEnum {
    EN = "EN",
    SW = "SW"
}
export declare class UpdateSettingsDto {
    darkMode?: boolean;
    pushNotifications?: boolean;
    emailAlerts?: boolean;
    smsNotifications?: boolean;
    transactionNotifications?: boolean;
    billPaymentReminders?: boolean;
    preferredLanguage?: PreferredLanguageEnum;
}
