// Church name shown on the sign-in screen before anyone is signed in. Set EXPO_PUBLIC_CHURCH_NAME per build;
// when it is unset, callers fall back to the neutral app name from the i18n dictionaries.
const configuredChurchName = process.env.EXPO_PUBLIC_CHURCH_NAME?.trim() ?? ""

export const CHURCH_NAME: string | null = configuredChurchName || null
