// Staff announcement editor and list copy (web). Swahili values are drafts marked sw-review-pending.
export const announcementsWebMessages = {
  en: {
    "nav.announcements": "Announcements",

    "announcements.list.title": "Announcements",
    "announcements.list.description": "Write, save and publish announcements for members.",
    "announcements.list.new": "New announcement",
    "announcements.list.open": "Open",
    "announcements.list.empty": "No announcements yet.",
    "announcements.list.column.title": "Title",
    "announcements.list.column.status": "Status",
    "announcements.list.column.date": "Date",
    "announcements.status.draft": "Draft",
    "announcements.status.pending_approval": "Pending approval",
    "announcements.status.published": "Published",
    "announcements.status.scheduled": "Scheduled",
    "announcements.status.cancelled": "Cancelled",

    "announcements.editor.newTitle": "New announcement",
    "announcements.editor.editTitle": "Edit announcement",
    "announcements.editor.description": "Save a draft, then publish it when it is ready.",
    "announcements.editor.back": "Back to announcements",
    "announcements.field.title": "Title",
    "announcements.field.titleHint": "Up to 200 characters.",
    "announcements.field.summary": "Summary (optional)",
    "announcements.field.summaryHint": "Up to 300 characters. Members see it before they open the full announcement.",
    "announcements.field.body": "Content",

    "announcements.toolbar.label": "Formatting",
    "announcements.toolbar.bold": "Bold",
    "announcements.toolbar.italic": "Italic",
    "announcements.toolbar.heading1": "Heading 1",
    "announcements.toolbar.heading2": "Heading 2",
    "announcements.toolbar.bulletList": "Bulleted list",
    "announcements.toolbar.orderedList": "Numbered list",
    "announcements.toolbar.quote": "Quote",
    "announcements.toolbar.link": "Link",
    "announcements.toolbar.image": "Add image",
    "announcements.toolbar.file": "Add PDF",
    "announcements.link.label": "Web address",
    "announcements.link.placeholder": "https://example.org",
    "announcements.link.apply": "Apply link",
    "announcements.link.remove": "Remove link",
    "announcements.link.cancel": "Cancel",
    "announcements.upload.uploading": "Uploading…",
    "announcements.attach.imageType": "Use a JPEG, PNG or WebP image.",
    "announcements.attach.imageSize": "Images must be 8 MB or smaller.",
    "announcements.attach.fileType": "Only PDF files can be attached.",
    "announcements.attach.fileSize": "PDF files must be 10 MB or smaller.",
    "announcements.image.loading": "Loading image…",
    "announcements.image.unavailable": "This image cannot be shown.",
    "announcements.file.loading": "Preparing file…",
    "announcements.file.open": "Open PDF",
    "announcements.file.unavailable": "This file is not available right now.",

    "announcements.channels.heading": "Channels",
    "announcements.channels.inApp": "In app",
    "announcements.channels.inAppNote": "Always on. Members see it in the app.",
    "announcements.channels.email": "Email",
    "announcements.channels.sms": "SMS",
    "announcements.channels.unavailable": "Not available yet.",

    "announcements.actions.saveDraft": "Save draft",
    "announcements.actions.saving": "Saving…",
    "announcements.actions.publish": "Publish",
    "announcements.actions.publishing": "Publishing…",
    "announcements.actions.cancel": "Cancel",
    "announcements.saved": "Draft saved.",
    "announcements.unsaved": "Unsaved changes.",
    "announcements.published": "Announcement published.",
    "announcements.sentForApproval": "Sent for approval. It will be published once it is approved.",
    "announcements.confirm.title": "Publish this announcement?",
    "announcements.confirm.body": "Members will be able to see it once it is published.",
    "announcements.confirm.action": "Publish",
    "announcements.readOnly": "This announcement is no longer a draft, so it cannot be edited.",
    "announcements.viewOnly": "View only. You do not have permission to publish announcements.",
    "announcements.validation.titleRequired": "Enter a title.",
    "announcements.validation.bodyRequired": "Add some content before publishing.",
    "announcements.validation.linkNotHttps": "Links must start with https://",
    "announcements.error.generic": "Something went wrong. Try again.",
    "announcements.error.notFound": "This announcement could not be found.",
    "announcements.error.forbidden": "You do not have permission to do this.",
    "announcements.error.validation": "Check the title, summary and content.",
    "announcements.error.notDraft": "This announcement has changed. Refresh the page and try again.",
    "announcements.error.network": "The server could not be reached. Check your connection.",
    "announcements.error.attachmentFailed": "The file could not be uploaded. Try again.",
    "announcements.error.loadFailed": "Announcements could not be loaded. Try again.",
  },
  sw: {
    "nav.announcements": "Matangazo", // sw-review-pending

    "announcements.list.title": "Matangazo", // sw-review-pending
    "announcements.list.description": "Andika, hifadhi na chapisha matangazo kwa wanachama.", // sw-review-pending
    "announcements.list.new": "Tangazo jipya", // sw-review-pending
    "announcements.list.open": "Fungua", // sw-review-pending
    "announcements.list.empty": "Bado hakuna matangazo.", // sw-review-pending
    "announcements.list.column.title": "Kichwa", // sw-review-pending
    "announcements.list.column.status": "Hali", // sw-review-pending
    "announcements.list.column.date": "Tarehe", // sw-review-pending
    "announcements.status.draft": "Rasimu", // sw-review-pending
    "announcements.status.pending_approval": "Inasubiri idhini", // sw-review-pending
    "announcements.status.published": "Imechapishwa", // sw-review-pending
    "announcements.status.scheduled": "Imepangwa", // sw-review-pending
    "announcements.status.cancelled": "Imeghairiwa", // sw-review-pending

    "announcements.editor.newTitle": "Tangazo jipya", // sw-review-pending
    "announcements.editor.editTitle": "Hariri tangazo", // sw-review-pending
    "announcements.editor.description": "Hifadhi rasimu, kisha uchapishe itakapokuwa tayari.", // sw-review-pending
    "announcements.editor.back": "Rudi kwenye matangazo", // sw-review-pending
    "announcements.field.title": "Kichwa", // sw-review-pending
    "announcements.field.titleHint": "Hadi herufi 200.", // sw-review-pending
    "announcements.field.summary": "Muhtasari (si lazima)", // sw-review-pending
    "announcements.field.summaryHint": "Hadi herufi 300. Wanachama wanaliona kabla ya kufungua tangazo kamili.", // sw-review-pending
    "announcements.field.body": "Maudhui", // sw-review-pending

    "announcements.toolbar.label": "Zana za uandishi", // sw-review-pending
    "announcements.toolbar.bold": "Nzito", // sw-review-pending
    "announcements.toolbar.italic": "Mteremko", // sw-review-pending
    "announcements.toolbar.heading1": "Kichwa 1", // sw-review-pending
    "announcements.toolbar.heading2": "Kichwa 2", // sw-review-pending
    "announcements.toolbar.bulletList": "Orodha yenye vitone", // sw-review-pending
    "announcements.toolbar.orderedList": "Orodha yenye namba", // sw-review-pending
    "announcements.toolbar.quote": "Nukuu", // sw-review-pending
    "announcements.toolbar.link": "Kiungo", // sw-review-pending
    "announcements.toolbar.image": "Ongeza picha", // sw-review-pending
    "announcements.toolbar.file": "Ongeza faili ya PDF", // sw-review-pending
    "announcements.link.label": "Anwani ya wavuti", // sw-review-pending
    "announcements.link.placeholder": "https://...", // sw-review-pending
    "announcements.link.apply": "Weka kiungo", // sw-review-pending
    "announcements.link.remove": "Ondoa kiungo", // sw-review-pending
    "announcements.link.cancel": "Ghairi", // sw-review-pending
    "announcements.upload.uploading": "Inapakia…", // sw-review-pending
    "announcements.attach.imageType": "Tumia picha ya JPEG, PNG au WebP.", // sw-review-pending
    "announcements.attach.imageSize": "Picha lazima iwe chini ya MB 8.", // sw-review-pending
    "announcements.attach.fileType": "Ni faili za PDF pekee zinazoweza kuambatishwa.", // sw-review-pending
    "announcements.attach.fileSize": "Faili ya PDF lazima iwe chini ya MB 10.", // sw-review-pending
    "announcements.image.loading": "Inapakia picha…", // sw-review-pending
    "announcements.image.unavailable": "Picha hii haiwezi kuonyeshwa.", // sw-review-pending
    "announcements.file.loading": "Inaandaa faili…", // sw-review-pending
    "announcements.file.open": "Fungua PDF", // sw-review-pending
    "announcements.file.unavailable": "Faili hii haipatikani kwa sasa.", // sw-review-pending

    "announcements.channels.heading": "Njia za kutuma", // sw-review-pending
    "announcements.channels.inApp": "Ndani ya programu", // sw-review-pending
    "announcements.channels.inAppNote": "Daima imewashwa. Wanachama wanaiona ndani ya programu.", // sw-review-pending
    "announcements.channels.email": "Barua pepe", // sw-review-pending
    "announcements.channels.sms": "Ujumbe mfupi wa SMS", // sw-review-pending
    "announcements.channels.unavailable": "Bado hazipatikani.", // sw-review-pending

    "announcements.actions.saveDraft": "Hifadhi rasimu", // sw-review-pending
    "announcements.actions.saving": "Inahifadhi…", // sw-review-pending
    "announcements.actions.publish": "Chapisha", // sw-review-pending
    "announcements.actions.publishing": "Inachapisha…", // sw-review-pending
    "announcements.actions.cancel": "Ghairi", // sw-review-pending
    "announcements.saved": "Rasimu imehifadhiwa.", // sw-review-pending
    "announcements.unsaved": "Mabadiliko hayajahifadhiwa.", // sw-review-pending
    "announcements.published": "Tangazo limechapishwa.", // sw-review-pending
    "announcements.sentForApproval": "Limetumwa kwa idhini. Litachapishwa likishaidhinishwa.", // sw-review-pending
    "announcements.confirm.title": "Chapisha tangazo hili?", // sw-review-pending
    "announcements.confirm.body": "Wanachama wataliona mara litakapochapishwa.", // sw-review-pending
    "announcements.confirm.action": "Chapisha", // sw-review-pending
    "announcements.readOnly": "Tangazo hili si rasimu tena, kwa hiyo haliwezi kuhaririwa.", // sw-review-pending
    "announcements.viewOnly": "Unaona tu. Huna ruhusa ya kuchapisha matangazo.", // sw-review-pending
    "announcements.validation.titleRequired": "Andika kichwa.", // sw-review-pending
    "announcements.validation.bodyRequired": "Ongeza maudhui kabla ya kuchapisha.", // sw-review-pending
    "announcements.validation.linkNotHttps": "Viungo lazima vianze na https://", // sw-review-pending
    "announcements.error.generic": "Kuna hitilafu. Jaribu tena.", // sw-review-pending
    "announcements.error.notFound": "Tangazo hili halipatikani.", // sw-review-pending
    "announcements.error.forbidden": "Huna ruhusa ya kufanya hili.", // sw-review-pending
    "announcements.error.validation": "Angalia kichwa, muhtasari na maudhui.", // sw-review-pending
    "announcements.error.notDraft": "Tangazo hili limebadilika. Onyesha upya ukurasa kisha ujaribu tena.", // sw-review-pending
    "announcements.error.network": "Seva haipatikani. Angalia muunganisho wako.", // sw-review-pending
    "announcements.error.attachmentFailed": "Faili haikupakiwa. Jaribu tena.", // sw-review-pending
    "announcements.error.loadFailed": "Matangazo hayakuweza kupakiwa. Jaribu tena.", // sw-review-pending
  },
} as const
