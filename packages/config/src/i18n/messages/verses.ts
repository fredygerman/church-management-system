// Verse of the day copy for the API-backed member card and the staff editor (web and mobile). Swahili values are drafts marked sw-review-pending.
export const versesMessages = {
  en: {
    "verses.title": "Verse of the day",
    "verses.heading": "Verse of the day",
    "verses.subtitle": "Members see one verse each day. Staff can choose the verse for any day.",
    "verses.today": "Today",
    "verses.source.override": "Chosen by staff",
    "verses.source.rotation": "From the church list",
    "verses.source.default": "Built-in verse",
    "verses.none": "No verse for today yet.",
    "verses.swMissing": "The Swahili text for this verse is not available yet.",
    "verses.list.heading": "Verse list",
    "verses.list.empty": "No verses added yet. Built-in verses are used until you add some.",
    "verses.list.inactive": "Not in rotation",
    "verses.add": "Add verse",
    "verses.edit": "Edit",
    "verses.delete": "Delete",
    "verses.confirmDelete": "Delete this verse?",
    "verses.activate": "Put back in rotation",
    "verses.deactivate": "Remove from rotation",
    "verses.field.reference": "Reference",
    "verses.field.referenceHint": "For example Psalm 23:1",
    "verses.field.textEn": "English text",
    "verses.field.textSw": "Swahili text (optional)",
    "verses.field.textSwHint": "Leave empty until the church approves a Swahili translation.",
    "verses.save": "Save",
    "verses.cancel": "Cancel",
    "verses.overrides.heading": "Next 30 days",
    "verses.overrides.choose": "Choose verse",
    "verses.overrides.clear": "Use the automatic verse",
    "verses.overrides.pastDate": "You cannot change a past day.",
    "verses.saved": "Saved.",
    "verses.readOnly": "View only. Ask a church admin to change verses.",
    "verses.error.generic": "Something went wrong. Try again.",
    "verses.error.noPermission": "You do not have permission to change verses.",
  },
  sw: {
    "verses.title": "Mstari wa siku", // sw-review-pending
    "verses.heading": "Mstari wa siku", // sw-review-pending
    "verses.subtitle": "Wanachama huona mstari mmoja kila siku. Wafanyakazi wanaweza kuchagua mstari wa siku yoyote.", // sw-review-pending
    "verses.today": "Leo", // sw-review-pending
    "verses.source.override": "Imechaguliwa na wafanyakazi", // sw-review-pending
    "verses.source.rotation": "Kutoka orodha ya kanisa", // sw-review-pending
    "verses.source.default": "Mstari wa kawaida", // sw-review-pending
    "verses.none": "Hakuna mstari wa leo bado.", // sw-review-pending
    "verses.swMissing": "Maandishi ya Kiswahili ya mstari huu bado hayapatikani.", // sw-review-pending
    "verses.list.heading": "Orodha ya mistari", // sw-review-pending
    "verses.list.empty": "Bado hakuna mistari. Mistari ya kawaida hutumika hadi uongeze.", // sw-review-pending
    "verses.list.inactive": "Haimo kwenye mzunguko", // sw-review-pending
    "verses.add": "Ongeza mstari", // sw-review-pending
    "verses.edit": "Hariri", // sw-review-pending
    "verses.delete": "Futa", // sw-review-pending
    "verses.confirmDelete": "Futa mstari huu?", // sw-review-pending
    "verses.activate": "Rudisha kwenye mzunguko", // sw-review-pending
    "verses.deactivate": "Ondoa kwenye mzunguko", // sw-review-pending
    "verses.field.reference": "Marejeo", // sw-review-pending
    "verses.field.referenceHint": "Kwa mfano Zaburi 23:1", // sw-review-pending
    "verses.field.textEn": "Maandishi ya Kiingereza", // sw-review-pending
    "verses.field.textSw": "Maandishi ya Kiswahili (si lazima)", // sw-review-pending
    "verses.field.textSwHint": "Acha wazi hadi kanisa lidhibitishe tafsiri ya Kiswahili.", // sw-review-pending
    "verses.save": "Hifadhi", // sw-review-pending
    "verses.cancel": "Ghairi", // sw-review-pending
    "verses.overrides.heading": "Siku 30 zijazo", // sw-review-pending
    "verses.overrides.choose": "Chagua mstari", // sw-review-pending
    "verses.overrides.clear": "Tumia mstari wa kiotomatiki", // sw-review-pending
    "verses.overrides.pastDate": "Huwezi kubadilisha siku iliyopita.", // sw-review-pending
    "verses.saved": "Imehifadhiwa.", // sw-review-pending
    "verses.readOnly": "Kusoma tu. Muulize msimamizi wa kanisa kubadilisha mistari.", // sw-review-pending
    "verses.error.generic": "Hitilafu imetokea. Jaribu tena.", // sw-review-pending
    "verses.error.noPermission": "Huna ruhusa ya kubadilisha mistari.", // sw-review-pending
  },
} as const
