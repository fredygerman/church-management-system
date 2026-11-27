import * as ImagePicker from "expo-image-picker"
import type { AvatarAsset } from "./avatar-api"

export type AvatarSource = "library" | "camera"

export type PickOutcome =
  | { kind: "picked"; asset: AvatarAsset }
  | { kind: "cancelled" }
  | { kind: "denied"; source: AvatarSource }

// Square crop, quality 0.8: the same options for camera and library.
const EDITING_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
}

/** Asks for permission, then opens the camera or library. A denial is reported as an outcome, not thrown. */
export async function pickAvatar(source: AvatarSource): Promise<PickOutcome> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) return { kind: "denied", source }
    const result = await ImagePicker.launchCameraAsync(EDITING_OPTIONS)
    return result.canceled || !result.assets?.[0] ? { kind: "cancelled" } : { kind: "picked", asset: result.assets[0] }
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return { kind: "denied", source }
  const result = await ImagePicker.launchImageLibraryAsync(EDITING_OPTIONS)
  return result.canceled || !result.assets?.[0] ? { kind: "cancelled" } : { kind: "picked", asset: result.assets[0] }
}
